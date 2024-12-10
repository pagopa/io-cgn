/* eslint-disable no-invalid-this */
import * as redis from "redis";
import { IConfig } from "./config";

export type RedisClient = redis.RedisClientType;

/**
 * Redis client factory singleton
 */
let redisClientFactory: RedisClientFactory;

export const getRedisClientFactory = (config: IConfig) => {
  if(!redisClientFactory) {
    const newRedisClientFactory = new RedisClientFactory(config);
    redisClientFactory = newRedisClientFactory;
  }
  return redisClientFactory;
}

/**
 * Class that instantiate connection to Redis
 */
export class RedisClientFactory {
  protected readonly config: IConfig;
  // eslint-disable-next-line functional/prefer-readonly-type
  protected redisClient: RedisClient | undefined;

  constructor(config: IConfig) {
    this.config = config;
  }

  public readonly getInstance = async (): Promise<RedisClient> => {
    if (!this.redisClient) {
      this.redisClient = await this.createSimpleRedisClient(
        this.config.REDIS_URL,
        this.config.REDIS_PASSWORD,
        this.config.REDIS_PORT,
        this.config.REDIS_TLS_ENABLED
      );
    }
    return this.redisClient;
  };

  protected readonly createSimpleRedisClient = async (
    redisUrl: string,
    password?: string,
    port?: string,
    useTls: boolean = true
  ): Promise<RedisClient> => {
    const DEFAULT_REDIS_PORT = useTls ? "6380" : "6379";
    const redisPort: number = parseInt(port || DEFAULT_REDIS_PORT, 10);
    const redisClientConnection = redis.createClient<
      redis.RedisDefaultModules,
      Record<string, never>,
      Record<string, never>
    >({
      password,
      pingInterval: 1000 * 60 * 9,
      socket: {
        port: redisPort,
        tls: useTls
      },
      url: useTls ? `rediss://${redisUrl}` : `redis://${redisUrl}`
    });
    await redisClientConnection.connect();
    return redisClientConnection;
  };
}
