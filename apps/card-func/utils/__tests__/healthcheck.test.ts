import * as E from "fp-ts/lib/Either";

import { IConfig } from "../config";
import { checkRedisConnection } from "../healthcheck";
import { getRedisClientFactory } from "../redis";

jest.mock("../redis", () => ({ getRedisClientFactory: jest.fn() }));

const getRedisClientFactoryMock = getRedisClientFactory as jest.Mock;
const aConfig = {} as IConfig;
const pingMock = jest.fn();
const getInstanceMock = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  pingMock.mockResolvedValue("PONG");
  getInstanceMock.mockResolvedValue({ PING: pingMock });
  getRedisClientFactoryMock.mockReturnValue({ getInstance: getInstanceMock });
});

describe("checkRedisConnection", () => {
  it("should be healthy when redis answers to PING", async () => {
    const result = await checkRedisConnection(aConfig)();

    expect(result).toEqual(E.right(true));
    expect(pingMock).toHaveBeenCalledTimes(1);
  });

  it("should report a problem when the connection fails", async () => {
    getInstanceMock.mockRejectedValueOnce(new Error("connect failed"));

    const result = await checkRedisConnection(aConfig)();

    expect(result).toEqual(E.left(["RedisConnection|connect failed"]));
  });

  it("should report a problem when PING fails", async () => {
    pingMock.mockRejectedValueOnce(new Error("ping failed"));

    const result = await checkRedisConnection(aConfig)();

    expect(result).toEqual(E.left(["RedisConnection|ping failed"]));
  });
});
