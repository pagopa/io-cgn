import * as TE from "fp-ts/TaskEither";
import {
  aSetOfExpiredRows,
  context,
  enqueueMessageMock,
  getExpiredCardUsersFunctionMock,
  queueStorageMock
} from "../../__mocks__/mock";
import { getUpdateExpiredCgnHandler } from "../handler";
import { setTelemetryClient } from "../../utils/appinsights";
import { telemetryClientMock } from "../../__mocks__/mock";

setTelemetryClient(telemetryClientMock);

describe("CgnExpired_1_Start", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fail if table storage fails", async () => {
    getExpiredCardUsersFunctionMock.mockReturnValueOnce(
      TE.left(new Error("error"))
    );

    const promised = getUpdateExpiredCgnHandler(
      getExpiredCardUsersFunctionMock,
      queueStorageMock
    )(context);

    await expect(promised).rejects.toStrictEqual(new Error("error"));
    expect(enqueueMessageMock).not.toBeCalled();
  });

  it("should fail if at least one enqueue operation fails", async () => {
    enqueueMessageMock.mockReturnValueOnce(TE.left(new Error("error")));

    const promised = getUpdateExpiredCgnHandler(
      getExpiredCardUsersFunctionMock,
      queueStorageMock
    )(context);

    await expect(promised).rejects.toStrictEqual(new Error("error"));
    expect(enqueueMessageMock).toBeCalledTimes(aSetOfExpiredRows.length);
  });

  it("should process send all fiscalCodes present on table to queue", async () => {
    const promised = getUpdateExpiredCgnHandler(
      getExpiredCardUsersFunctionMock,
      queueStorageMock
    )(context);

    await expect(promised).resolves.toBe(true);
    expect(enqueueMessageMock).toBeCalledTimes(aSetOfExpiredRows.length);
  });
});
