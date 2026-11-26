import { createRedisClient } from "@pagopa/io-cgn-core-redis";

import { IConfig } from "../config.js";
import { RedisClient, RedisClientFactory } from "../redis.js";

jest.mock("@pagopa/io-cgn-core-redis", () => ({
  createRedisClient: jest.fn(),
}));

const createRedisClientMock = createRedisClient as jest.Mock;

const aConfig = {
  REDIS_ENTRA_ID_ENABLED: true,
  REDIS_PORT: "10000",
  REDIS_URL: "url",
} as unknown as IConfig;

const aClient = { GET: jest.fn() } as unknown as RedisClient;

beforeEach(() => {
  jest.clearAllMocks();
  createRedisClientMock.mockResolvedValue(aClient);
});

describe("RedisClientFactory", () => {
  it("should map the configuration to the redis client options", async () => {
    await new RedisClientFactory(aConfig).getInstance();

    expect(createRedisClientMock).toHaveBeenCalledWith({
      entraIdEnabled: true,
      host: "url",
      onError: expect.any(Function),
      port: 10000,
    });
  });

  it("should leave Entra ID to the package default when REDIS_ENTRA_ID_ENABLED is not set", async () => {
    await new RedisClientFactory({
      ...aConfig,
      REDIS_ENTRA_ID_ENABLED: undefined,
    }).getInstance();

    expect(createRedisClientMock).toHaveBeenCalledWith(
      expect.objectContaining({ entraIdEnabled: undefined }),
    );
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
