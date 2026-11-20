import { RedisCommands, createRedisClient } from "@pagopa/io-cgn-core-redis";

import { trackErrorToVoid } from "./appinsights.js";
import { IConfig } from "./config.js";

export type RedisClient = RedisCommands;

/**
 * RedisClientFactory singleton
 */
let redisClientFactory: RedisClientFactory;

export const getRedisClientFactory = (config: IConfig) => {
  if (!redisClientFactory) {
    const newRedisClientFactory = new RedisClientFactory(config);
    redisClientFactory = newRedisClientFactory;
  }
  return redisClientFactory;
};

/**
 * Class that instantiate connection to Redis
 */
export class RedisClientFactory {
  protected readonly config: IConfig;

  protected readonly createRedisClient = (): Promise<RedisClient> =>
    createRedisClient({
      clusterEnabled: this.config.REDIS_CLUSTER_ENABLED,
      entraIdEnabled: this.config.REDIS_ENTRA_ID_ENABLED,
      host: this.config.REDIS_URL,
      onError: (error) =>
        trackErrorToVoid(
          error instanceof Error ? error : new Error(String(error)),
          { source: "redis" },
        ),
      password: this.config.REDIS_PASSWORD,
      port: this.config.REDIS_PORT
        ? parseInt(this.config.REDIS_PORT, 10)
        : undefined,
      tlsEnabled: this.config.REDIS_TLS_ENABLED,
    });

  public readonly getInstance = (): Promise<RedisClient> => {
    // Cached as a promise, so concurrent first calls share one connection.
    if (!this.redisClient) {
      this.redisClient = this.createRedisClient().catch((error: unknown) => {
        this.redisClient = undefined;
        throw error;
      });
    }
    return this.redisClient;
  };

  protected redisClient: Promise<RedisClient> | undefined;

  constructor(config: IConfig) {
    this.config = config;
  }
}
