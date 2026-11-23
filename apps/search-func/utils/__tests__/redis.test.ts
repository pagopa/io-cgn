import { createRedisClient } from "@pagopa/io-cgn-core-redis";

import { IConfig } from "../config";
import { RedisClient, RedisClientFactory } from "../redis";

jest.mock("@pagopa/io-cgn-core-redis", () => ({
  createRedisClient: jest.fn(),
}));

const createRedisClientMock = createRedisClient as jest.Mock;

const aConfig = {
  REDIS_CLUSTER_ENABLED: true,
  REDIS_ENTRA_ID_ENABLED: true,
  REDIS_PASSWORD: "password",
  REDIS_PORT: "6379",
  REDIS_TLS_ENABLED: false,
  REDIS_URL: "url",
} as unknown as IConfig;

const aClient = { LPOP: jest.fn() } as unknown as RedisClient;

beforeEach(() => {
  jest.clearAllMocks();
  createRedisClientMock.mockResolvedValue(aClient);
});

describe("RedisClientFactory", () => {
  it("should map the configuration to the redis client options", async () => {
    await new RedisClientFactory(aConfig).getInstance();

    expect(createRedisClientMock).toHaveBeenCalledWith({
      clusterEnabled: true,
      entraIdEnabled: true,
      host: "url",
      onError: expect.any(Function),
      password: "password",
      port: 6379,
      tlsEnabled: false,
    });
  });

  it("should leave the port to the package when REDIS_PORT is not set", async () => {
    await new RedisClientFactory({
      ...aConfig,
      REDIS_PORT: undefined,
    }).getInstance();

    expect(createRedisClientMock).toHaveBeenCalledWith(
      expect.objectContaining({ port: undefined }),
    );
  });

  it("should return the same client when getInstance gets called again", async () => {
    const factory = new RedisClientFactory(aConfig);

    const first = await factory.getInstance();
    const second = await factory.getInstance();

    expect(first).toBe(aClient);
    expect(second).toBe(first);
    expect(createRedisClientMock).toHaveBeenCalledTimes(1);
  });

  it("should share one connection between concurrent calls", async () => {
    const factory = new RedisClientFactory(aConfig);

    const [first, second] = await Promise.all([
      factory.getInstance(),
      factory.getInstance(),
    ]);

    expect(first).toBe(second);
    expect(createRedisClientMock).toHaveBeenCalledTimes(1);
  });

  it("should not cache a failed connection", async () => {
    createRedisClientMock.mockRejectedValueOnce(new Error("connect failed"));
    const factory = new RedisClientFactory(aConfig);

    await expect(factory.getInstance()).rejects.toThrow("connect failed");
    await expect(factory.getInstance()).resolves.toBe(aClient);

    expect(createRedisClientMock).toHaveBeenCalledTimes(2);
  });
});
