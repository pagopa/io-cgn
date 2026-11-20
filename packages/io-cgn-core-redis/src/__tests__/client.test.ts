import { EventEmitter } from "events";
import * as redis from "redis";

import {
  RedisClusterConfig,
  RedisDeps,
  createPasswordRedisClient,
  createRedisClient,
  createRedisClusterClient,
  createResilientRedisClient,
} from "../client";

const never = <T>() => new Promise<T>(() => undefined);

// Captures a rejection without awaiting it, so fake timers can be advanced.
const rejectionOf = (promise: Promise<unknown>): Promise<unknown> =>
  promise.then(
    () => {
      throw new Error("Expected the promise to reject");
    },
    (error: unknown) => error,
  );

class FakeCluster extends EventEmitter {
  isOpen = false;
  close = jest.fn(async () => {
    this.isOpen = false;
  });
  connect = jest.fn(async () => {
    this.isOpen = true;
    return this;
  });
  destroy = jest.fn(() => {
    this.isOpen = false;
  });
  DEL = jest.fn(async () => 1);
  EXISTS = jest.fn(async () => 1);
  GET = jest.fn(async (): Promise<null | string> => "value");
  LPOP = jest.fn(async (): Promise<null | string> => "code");
  LPUSH = jest.fn(async () => 2);
  PING = jest.fn(async () => "PONG");
  SETEX = jest.fn(async () => "OK");
}

const aCredentialsProvider = { type: "credentials-provider" };
const config: RedisClusterConfig = {
  commandTimeoutMs: 2_000,
  connectTimeoutMs: 20_000,
  host: "redis.example",
  port: 10000,
};

let clusters: FakeCluster[];
let nextClusterSetup: ((cluster: FakeCluster) => void)[];
let createCluster: jest.Mock;
let createClient: jest.Mock;
let simpleClient: { connect: jest.Mock };
let deps: RedisDeps;

beforeEach(() => {
  jest.useFakeTimers();
  clusters = [];
  nextClusterSetup = [];
  createCluster = jest.fn(() => {
    const cluster = new FakeCluster();
    nextClusterSetup.shift()?.(cluster);
    clusters.push(cluster);
    return cluster;
  });
  simpleClient = { connect: jest.fn(async () => undefined) };
  createClient = jest.fn(() => simpleClient);
  deps = {
    createClient: createClient as unknown as RedisDeps["createClient"],
    createCluster: createCluster as unknown as RedisDeps["createCluster"],
    createCredentialsProvider: () =>
      aCredentialsProvider as unknown as ReturnType<
        RedisDeps["createCredentialsProvider"]
      >,
  };
});

afterEach(() => {
  jest.useRealTimers();
});

describe("createRedisClusterClient", () => {
  it("should connect to the root node over TLS with the credentials provider", async () => {
    await createRedisClusterClient(config, deps);

    const options = createCluster.mock.calls[0][0];
    expect(options.rootNodes).toEqual([
      { url: "rediss://redis.example:10000" },
    ]);
    expect(options.defaults.credentialsProvider).toBe(aCredentialsProvider);
    expect(options.defaults.socket.tls).toBe(true);
  });

  it("should map the node addresses announced by the cluster to the configured host", async () => {
    await createRedisClusterClient(config, deps);

    const { nodeAddressMap } = createCluster.mock.calls[0][0];
    expect(nodeAddressMap("10.0.0.4:10001")).toEqual({
      host: "redis.example",
      port: 10001,
    });
    expect(nodeAddressMap("10.0.0.4")).toEqual({
      host: "redis.example",
      port: 10000,
    });
  });

  it("should let node-redis drop timed-out queued commands and replace silent connections", async () => {
    await createRedisClusterClient(config, deps);

    const options = createCluster.mock.calls[0][0];
    expect(options.commandOptions).toEqual({ timeout: 2_000 });
    expect(options.defaults.socket).toMatchObject({
      connectTimeout: 5_000,
      socketTimeout: 15_000,
    });
    // Pings must keep healthy idle connections below the socket timeout.
    expect(options.defaults.pingInterval).toBe(5_000);
  });

  it("should never stop reconnecting a node, even after a socket timeout", async () => {
    await createRedisClusterClient(config, deps);

    const { reconnectStrategy } =
      createCluster.mock.calls[0][0].defaults.socket;
    const timeout = new redis.SocketTimeoutError(15_000);
    expect(reconnectStrategy(0, timeout)).toBeGreaterThanOrEqual(50);
    expect(reconnectStrategy(1_000, timeout)).toBeGreaterThanOrEqual(2_000);
    expect(reconnectStrategy(1_000, timeout)).toBeLessThan(2_200);
  });

  it("should reject and destroy the cluster when connecting exceeds connectTimeoutMs", async () => {
    nextClusterSetup.push((cluster) =>
      cluster.connect.mockReturnValue(never()),
    );

    const rejection = rejectionOf(createRedisClusterClient(config, deps));
    await jest.advanceTimersByTimeAsync(20_000);

    await expect(rejection).resolves.toEqual(
      new Error("Redis connect timed out after 20000ms"),
    );
    expect(clusters[0].destroy).toHaveBeenCalledTimes(1);
  });

  it("should forward cluster and node errors to onError", async () => {
    const onError = jest.fn();
    await createRedisClusterClient({ ...config, onError }, deps);

    clusters[0].emit("error", new Error("cluster"));
    clusters[0].emit("node-error", new Error("node"));

    expect(onError).toHaveBeenCalledWith(new Error("cluster"));
    expect(onError).toHaveBeenCalledWith(new Error("node"));
  });

  it("should fall back to destroy when closing hangs", async () => {
    const client = await createRedisClusterClient(config, deps);
    clusters[0].close.mockReturnValue(never());

    const closing = client.closeConnection();
    await jest.advanceTimersByTimeAsync(2_000);
    await closing;

    expect(clusters[0].destroy).toHaveBeenCalledTimes(1);
  });
});

describe("createResilientRedisClient", () => {
  it("should reuse the same connection across commands", async () => {
    const client = await createResilientRedisClient(config, deps);

    await client.GET("key");
    await client.SETEX("key", 10, "value");
    await client.EXISTS("key");
    await client.DEL("key");
    await client.LPOP("list");
    await client.LPUSH("list", ["a", "b"]);
    await client.PING();

    expect(createCluster).toHaveBeenCalledTimes(1);
    expect(clusters[0].GET).toHaveBeenCalledWith("key");
    expect(clusters[0].SETEX).toHaveBeenCalledWith("key", 10, "value");
    expect(clusters[0].EXISTS).toHaveBeenCalledWith("key");
    expect(clusters[0].DEL).toHaveBeenCalledWith("key");
    expect(clusters[0].LPOP).toHaveBeenCalledWith("list");
    expect(clusters[0].LPUSH).toHaveBeenCalledWith("list", ["a", "b"]);
    expect(clusters[0].PING).toHaveBeenCalledTimes(1);
  });

  it("should rebuild the connection with destroy, never close, when the cluster is closed", async () => {
    const client = await createResilientRedisClient(config, deps);
    const first = clusters[0];
    first.isOpen = false;

    await expect(client.GET("key")).resolves.toBe("value");

    expect(createCluster).toHaveBeenCalledTimes(2);
    expect(first.destroy).toHaveBeenCalledTimes(1);
    expect(first.close).not.toHaveBeenCalled();
    expect(clusters[1].GET).toHaveBeenCalledTimes(1);
  });

  it("should reject a hanging command within commandTimeoutMs", async () => {
    const client = await createResilientRedisClient(config, deps);
    clusters[0].GET.mockReturnValue(never());

    const rejection = rejectionOf(client.GET("key"));
    await jest.advanceTimersByTimeAsync(2_000);

    await expect(rejection).resolves.toEqual(
      new Error("Redis command timed out after 2000ms"),
    );
  });

  it("should rebuild the connection after consecutive failed commands", async () => {
    const client = await createResilientRedisClient(config, deps);
    clusters[0].GET.mockRejectedValue(new Error("socket closed"));

    for (let i = 0; i < 3; i++) {
      await expect(client.GET("key")).rejects.toThrow("socket closed");
    }
    await expect(client.GET("key")).resolves.toBe("value");

    expect(createCluster).toHaveBeenCalledTimes(2);
    expect(clusters[0].destroy).toHaveBeenCalledTimes(1);
    expect(clusters[1].GET).toHaveBeenCalledTimes(1);
  });

  it("should reset the failure count after a successful command", async () => {
    const client = await createResilientRedisClient(config, deps);
    clusters[0].GET.mockRejectedValueOnce(new Error("socket closed"))
      .mockRejectedValueOnce(new Error("socket closed"))
      .mockResolvedValueOnce("value")
      .mockRejectedValueOnce(new Error("socket closed"))
      .mockRejectedValueOnce(new Error("socket closed"));

    for (let i = 0; i < 5; i++) {
      await client.GET("key").catch(() => undefined);
    }
    await client.GET("key");

    expect(createCluster).toHaveBeenCalledTimes(1);
  });

  it("should not count Redis error replies as connection failures", async () => {
    const client = await createResilientRedisClient(config, deps);
    const socketClosed = new Error("socket closed");
    const errorReply = new redis.ErrorReply("OOM command not allowed");
    clusters[0].GET.mockRejectedValueOnce(socketClosed)
      .mockRejectedValueOnce(socketClosed)
      .mockRejectedValueOnce(errorReply)
      .mockRejectedValueOnce(errorReply)
      .mockRejectedValueOnce(errorReply)
      .mockRejectedValueOnce(socketClosed)
      .mockRejectedValueOnce(socketClosed);

    for (let i = 0; i < 7; i++) {
      await client.GET("key").catch(() => undefined);
    }
    await expect(client.GET("key")).resolves.toBe("value");

    expect(createCluster).toHaveBeenCalledTimes(1);
  });

  it("should not stay blocked when a reconnection hangs", async () => {
    const client = await createResilientRedisClient(config, deps);
    nextClusterSetup.push((cluster) =>
      cluster.connect.mockReturnValue(never()),
    );
    clusters[0].isOpen = false;

    const rejection = rejectionOf(client.GET("key"));
    await jest.advanceTimersByTimeAsync(2_000);
    await expect(rejection).resolves.toEqual(
      new Error("Redis command timed out after 2000ms"),
    );

    // The hanging reconnection gives up on its own connect deadline.
    await jest.advanceTimersByTimeAsync(18_000);
    expect(clusters[1].destroy).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1_000);
    await expect(client.GET("key")).resolves.toBe("value");
    expect(clusters[2].GET).toHaveBeenCalledTimes(1);
  });

  it("should not run a command whose deadline expired while reconnecting", async () => {
    const client = await createResilientRedisClient(config, deps);
    nextClusterSetup.push((cluster) =>
      cluster.connect.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 3_000));
        cluster.isOpen = true;
        return cluster;
      }),
    );
    clusters[0].isOpen = false;

    const rejection = rejectionOf(client.SETEX("key", 10, "value"));
    await jest.advanceTimersByTimeAsync(3_000);

    await expect(rejection).resolves.toEqual(
      new Error("Redis command timed out after 2000ms"),
    );
    expect(clusters[1].isOpen).toBe(true);
    expect(clusters[1].SETEX).not.toHaveBeenCalled();
  });

  it("should back off after a failed reconnection", async () => {
    const client = await createResilientRedisClient(config, deps);
    nextClusterSetup.push((cluster) =>
      cluster.connect.mockRejectedValue(new Error("connection refused")),
    );
    clusters[0].isOpen = false;

    await expect(client.GET("key")).rejects.toThrow("connection refused");
    await expect(client.GET("key")).rejects.toThrow(
      "Redis reconnection failed, retrying shortly",
    );
    expect(createCluster).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(1_000);
    await expect(client.GET("key")).resolves.toBe("value");
    expect(createCluster).toHaveBeenCalledTimes(3);
  });

  it("should reject commands after the connection is closed", async () => {
    const client = await createResilientRedisClient(config, deps);

    await client.closeConnection();

    await expect(client.GET("key")).rejects.toThrow("Redis client is closed");
    expect(clusters[0].close).toHaveBeenCalledTimes(1);
    expect(createCluster).toHaveBeenCalledTimes(1);
  });
});

describe("createPasswordRedisClient", () => {
  it("should connect with the password over TLS on the default port", async () => {
    const client = await createPasswordRedisClient(
      { host: "redis.example", password: "secret" },
      deps,
    );

    expect(client).toBe(simpleClient);
    expect(createClient).toHaveBeenCalledWith({
      password: "secret",
      pingInterval: 1000 * 60 * 9,
      socket: { port: 6380, tls: true },
      url: "rediss://redis.example",
    });
    expect(simpleClient.connect).toHaveBeenCalledTimes(1);
  });

  it("should use the plain default port without TLS", async () => {
    await createPasswordRedisClient(
      { host: "redis.example", tlsEnabled: false },
      deps,
    );

    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        socket: { port: 6379, tls: false },
        url: "redis://redis.example",
      }),
    );
  });

  it("should use the configured port", async () => {
    await createPasswordRedisClient(
      { host: "redis.example", port: 6000 },
      deps,
    );

    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({ socket: { port: 6000, tls: true } }),
    );
  });

  it("should reject when the connection fails", async () => {
    simpleClient.connect.mockRejectedValueOnce(new Error("refused"));

    await expect(
      createPasswordRedisClient({ host: "redis.example" }, deps),
    ).rejects.toThrow("refused");
  });
});

describe("createRedisClient", () => {
  it.each`
    clusterEnabled | entraIdEnabled
    ${undefined}   | ${undefined}
    ${false}       | ${false}
    ${true}        | ${false}
    ${false}       | ${true}
  `(
    "should use the password client when clusterEnabled = $clusterEnabled and entraIdEnabled = $entraIdEnabled",
    async ({ clusterEnabled, entraIdEnabled }) => {
      await createRedisClient(
        {
          clusterEnabled,
          entraIdEnabled,
          host: "redis.example",
          password: "secret",
        },
        deps,
      );

      expect(createClient).toHaveBeenCalledTimes(1);
      expect(createCluster).not.toHaveBeenCalled();
    },
  );

  it("should use the cluster with Entra ID when both flags are enabled", async () => {
    await createRedisClient(
      {
        clusterEnabled: true,
        entraIdEnabled: true,
        host: "redis.example",
        password: "ignored",
      },
      deps,
    );

    expect(createClient).not.toHaveBeenCalled();
    expect(createCluster.mock.calls[0][0].rootNodes).toEqual([
      { url: "rediss://redis.example:10000" },
    ]);
  });

  it("should use the configured port in cluster mode", async () => {
    await createRedisClient(
      {
        clusterEnabled: true,
        entraIdEnabled: true,
        host: "redis.example",
        port: 10001,
      },
      deps,
    );

    expect(createCluster.mock.calls[0][0].rootNodes).toEqual([
      { url: "rediss://redis.example:10001" },
    ]);
  });
});
