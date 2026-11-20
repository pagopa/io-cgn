import * as entraid from "@redis/entraid";
import * as redis from "redis";

/** The Redis commands used by the function apps. */
export interface RedisCommands {
  DEL(key: string): Promise<number>;
  EXISTS(key: string): Promise<number>;
  GET(key: string): Promise<null | string>;
  LPOP(key: string): Promise<null | string>;
  LPUSH(key: string, elements: string[]): Promise<number>;
  PING(): Promise<string>;
  SETEX(key: string, seconds: number, value: string): Promise<null | string>;
}

export type RedisClient = RedisCommands;

export type RedisCluster = ReturnType<typeof redis.createCluster>;

type CredentialsProvider = NonNullable<
  redis.RedisClientOptions["credentialsProvider"]
>;

export type RedisClusterClient = {
  readonly closeConnection: () => Promise<void>;
} & RedisCluster;

export type ResilientRedisClient = {
  readonly closeConnection: () => Promise<void>;
} & RedisCommands;

export interface RedisClusterConfig {
  /** Max time for a command, including the wait for a (re)connection. */
  readonly commandTimeoutMs?: number;
  /** Max total time to connect to the cluster (discovery and all nodes). */
  readonly connectTimeoutMs?: number;
  readonly host: string;
  readonly onError?: (error: unknown) => void;
  readonly port: number;
}

export interface RedisPasswordConfig {
  readonly host: string;
  readonly password?: string;
  readonly port?: number;
  /** Defaults to true. */
  readonly tlsEnabled?: boolean;
}

export interface RedisClientConfig
  extends Omit<RedisClusterConfig, "port">,
    RedisPasswordConfig {
  /** Cluster mode is used only when Entra ID is enabled too. */
  readonly clusterEnabled?: boolean;
  readonly entraIdEnabled?: boolean;
}

export interface RedisDeps {
  readonly createClient: typeof redis.createClient;
  readonly createCluster: typeof redis.createCluster;
  readonly createCredentialsProvider: () => CredentialsProvider;
}

const DEFAULT_CLUSTER_PORT = 10000;
const DEFAULT_COMMAND_TIMEOUT_MS = 2_000;
const DEFAULT_CONNECT_TIMEOUT_MS = 20_000;
// Timeout of a single socket attempt: node-redis retries failed attempts on
// its own, so the overall bound is DEFAULT_CONNECT_TIMEOUT_MS.
const SOCKET_CONNECT_TIMEOUT_MS = 5_000;
// node-redis closes and reopens a node connection after this long without any
// traffic, which frees connections that stay open but stop answering. It must
// be longer than PING_INTERVAL_MS and than a cold Entra ID token fetch, which
// happens while this timer is already running.
const SOCKET_IDLE_TIMEOUT_MS = 15_000;
// Keeps healthy idle connections busy, so SOCKET_IDLE_TIMEOUT_MS only closes
// the ones that stopped answering.
const PING_INTERVAL_MS = 5_000;
const PASSWORD_PING_INTERVAL_MS = 1000 * 60 * 9;
const MAX_RECONNECT_DELAY_MS = 2_000;
// After this many failed commands in a row the cluster client is discarded
// and rebuilt, in case node-redis is stuck on dead connections.
const MAX_CONSECUTIVE_FAILURES = 3;
// Minimum delay between a failed reconnection and the next attempt.
const RECONNECT_BACKOFF_MS = 1_000;

const withDeadline = <T>(
  timeoutMs: number,
  operation: string,
  task: (signal: AbortSignal) => Promise<T>,
): Promise<T> => {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(
        `Redis ${operation} timed out after ${timeoutMs}ms`,
      );
      controller.abort(error);
      reject(error);
    }, timeoutMs);
  });
  const clear = () => clearTimeout(timer);
  return Promise.race([task(controller.signal), deadline]).then(
    (result) => {
      clear();
      return result;
    },
    (error: unknown) => {
      clear();
      throw error;
    },
  );
};

// Same backoff as the node-redis default, which instead stops for good after a
// socket timeout: a cluster never replaces a node client that gave up.
const reconnectStrategy = (retries: number): number =>
  Math.min(50 * 2 ** retries, MAX_RECONNECT_DELAY_MS) +
  Math.floor(Math.random() * 200);

const createSystemAssignedCredentialsProvider = (): CredentialsProvider =>
  entraid.EntraIdCredentialsProviderFactory.createForSystemAssignedManagedIdentity(
    {
      // Required by the type, not used for a system-assigned identity.
      clientId: "",
      tokenManagerConfig: { expirationRefreshRatio: 0.8 },
    },
  );

const defaultDeps: RedisDeps = {
  createClient: redis.createClient,
  createCluster: redis.createCluster,
  createCredentialsProvider: createSystemAssignedCredentialsProvider,
};

export const createRedisClusterClient = async (
  config: RedisClusterConfig,
  deps: RedisDeps = defaultDeps,
): Promise<RedisClusterClient> => {
  const commandTimeoutMs =
    config.commandTimeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;
  const onError = config.onError ?? (() => undefined);

  const client = deps.createCluster({
    // Drops commands still waiting for a connection once they time out, so
    // they do not run after the caller gave up. Commands already sent are not
    // covered: withDeadline bounds those.
    commandOptions: { timeout: commandTimeoutMs },
    defaults: {
      credentialsProvider: deps.createCredentialsProvider(),
      pingInterval: PING_INTERVAL_MS,
      socket: {
        connectTimeout: SOCKET_CONNECT_TIMEOUT_MS,
        reconnectStrategy,
        socketTimeout: SOCKET_IDLE_TIMEOUT_MS,
        tls: true,
      },
    },
    // The cluster announces its nodes by IP, which does not match the TLS
    // certificate: connect to them through the configured host name.
    nodeAddressMap: (incomingAddress: string) => {
      const [, port = String(config.port)] = incomingAddress.split(":");
      return { host: config.host, port: Number(port) };
    },
    rootNodes: [{ url: `rediss://${config.host}:${config.port}` }],
  });
  // The cluster reports its own failures as "error" and the failures of the
  // single node connections as "node-error".
  client.on("error", onError).on("node-error", onError);

  try {
    // node-redis retries an unreachable node forever, even while connecting.
    await withDeadline(
      config.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS,
      "connect",
      () => client.connect(),
    );
  } catch (error) {
    client.destroy();
    throw error;
  }

  return Object.assign(client, {
    // close() waits for in-flight replies, which never arrive on a dead socket.
    closeConnection: () =>
      withDeadline(commandTimeoutMs, "close", () => client.close()).catch(() =>
        client.destroy(),
      ),
  });
};

export const createResilientRedisClient = async (
  config: RedisClusterConfig,
  deps: RedisDeps = defaultDeps,
): Promise<ResilientRedisClient> => {
  const commandTimeoutMs =
    config.commandTimeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;

  let client = await createRedisClusterClient(config, deps);
  let reconnecting: Promise<RedisClusterClient> | null = null;
  let consecutiveFailures = 0;
  let nextReconnectAt = 0;
  let closed = false;

  const reconnect = (): Promise<RedisClusterClient> => {
    if (reconnecting !== null) {
      return reconnecting;
    }
    if (Date.now() < nextReconnectAt) {
      return Promise.reject(
        new Error("Redis reconnection failed, retrying shortly"),
      );
    }
    // destroy() never waits on the network, unlike quit()/close().
    client.destroy();
    const attempt = createRedisClusterClient(config, deps).then(
      (newClient) => {
        client = newClient;
        consecutiveFailures = 0;
        return newClient;
      },
      (error: unknown) => {
        nextReconnectAt = Date.now() + RECONNECT_BACKOFF_MS;
        throw error;
      },
    );
    const done = () => {
      reconnecting = null;
    };
    attempt.then(done, done);
    reconnecting = attempt;
    return attempt;
  };

  const getClient = (): Promise<RedisClusterClient> => {
    if (closed) {
      return Promise.reject(new Error("Redis client is closed"));
    }
    if (
      reconnecting === null &&
      client.isOpen &&
      consecutiveFailures < MAX_CONSECUTIVE_FAILURES
    ) {
      return Promise.resolve(client);
    }
    return reconnect();
  };

  // The node-redis command timeout stops once a command is sent, and the idle
  // socket timeout never fires while other commands keep the connection busy:
  // this deadline is the only bound for a command sent on a dead connection.
  const run = <T>(command: (c: RedisCluster) => Promise<T>): Promise<T> =>
    withDeadline(commandTimeoutMs, "command", async (signal) => {
      const c = await getClient();
      // The caller has already received a timeout: do not run it late.
      signal.throwIfAborted();
      // Aborting drops a command still unsent; the options are not merged.
      return command(
        c.withCommandOptions({
          abortSignal: signal,
          timeout: commandTimeoutMs,
        }),
      );
    }).then(
      (result) => {
        consecutiveFailures = 0;
        return result;
      },
      (error: unknown) => {
        // An error reply (e.g. OOM) proves the connection works.
        consecutiveFailures =
          error instanceof redis.ErrorReply ? 0 : consecutiveFailures + 1;
        throw error;
      },
    );

  return {
    DEL: (key) => run((c) => c.DEL(key)),
    EXISTS: (key) => run((c) => c.EXISTS(key)),
    GET: (key) => run((c) => c.GET(key)),
    LPOP: (key) => run((c) => c.LPOP(key)),
    LPUSH: (key, elements) => run((c) => c.LPUSH(key, elements)),
    PING: () => run((c) => c.PING()),
    SETEX: (key, seconds, value) => run((c) => c.SETEX(key, seconds, value)),
    closeConnection: async () => {
      closed = true;
      await reconnecting?.catch(() => undefined);
      await client.closeConnection();
    },
  };
};

export const createPasswordRedisClient = async (
  config: RedisPasswordConfig,
  deps: RedisDeps = defaultDeps,
): Promise<RedisClient> => {
  const useTls = config.tlsEnabled ?? true;
  const port = config.port ?? (useTls ? 6380 : 6379);
  const client = deps.createClient({
    password: config.password,
    pingInterval: PASSWORD_PING_INTERVAL_MS,
    socket: useTls ? { port, tls: true } : { port, tls: false },
    url: `${useTls ? "rediss" : "redis"}://${config.host}`,
  });
  await client.connect();
  return client;
};

/**
 * The cluster with Entra ID authentication is used only when both flags are
 * enabled, otherwise a single node with a password.
 */
export const createRedisClient = (
  config: RedisClientConfig,
  deps: RedisDeps = defaultDeps,
): Promise<RedisClient> =>
  config.clusterEnabled && config.entraIdEnabled
    ? createResilientRedisClient(
        { ...config, port: config.port ?? DEFAULT_CLUSTER_PORT },
        deps,
      )
    : createPasswordRedisClient(config, deps);
