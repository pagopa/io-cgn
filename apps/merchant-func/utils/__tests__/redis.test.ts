import { IConfig } from "../config";
import { RedisClient, RedisClientFactory } from "../redis";

const baseConfigMockForRedisFactory = {
  REDIS_CLUSTER_ENABLED: false,
  REDIS_PASSWORD: "password",
  REDIS_PORT: 6379,
  REDIS_TLS_ENABLED: false,
  REDIS_URL: "url",
  isProduction: false,
} as unknown as IConfig;

describe("RedisClientFactory", () => {
  it.each`
    instanceType | isProduction | isClusterEnabled
    ${"simple"}  | ${false}     | ${false}
    ${"simple"}  | ${true}      | ${false}
    ${"simple"}  | ${false}     | ${true}
  `(
    "should resolve to a $instanceType client when isProduction = $isProduction and REDIS_CLUSTER_ENABLED = $isClusterEnabled",
    async ({ isClusterEnabled, isProduction }) => {
      const redisClientFactory = new RedisClientFactory({
        ...baseConfigMockForRedisFactory,
        REDIS_CLUSTER_ENABLED: isClusterEnabled,
        isProduction,
      });

      // override the connection methods to return test clients
      // with properties injected for testing purposes
      let instanceNumber = 0;
      Object.assign(redisClientFactory, {
        createClusterRedisClient: async () =>
          ({
            instanceNumber: instanceNumber++,
            isCluster: true,
          }) as unknown as RedisClient,
        createSimpleRedisClient: async () =>
          ({
            instanceNumber: instanceNumber++,
            isCluster: false,
          }) as unknown as RedisClient,
      });

      expect(instanceNumber).toBe(0);
      const redisClient = await redisClientFactory.getInstance();
      //@ts-ignore to check a property injected for testing purposes
      expect(redisClient.isCluster).toBe(isProduction && isClusterEnabled);
      //@ts-ignore to check a property injected for testing purposes
      expect(redisClient.instanceNumber).toBe(0);

      // factory MUST return the same client when getInstance gets called again
      expect(instanceNumber).toBe(1);
      const redisClient2 = await redisClientFactory.getInstance();
      //@ts-ignore to check a property injected for testing purposes
      expect(redisClient2.instanceType).toBe(redisClient.instanceType);
      //@ts-ignore to check a property injected for testing purposes
      expect(redisClient2.instanceNumber).toBe(redisClient.instanceNumber);
    },
  );
});
