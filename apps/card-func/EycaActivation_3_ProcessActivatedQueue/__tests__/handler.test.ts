import * as TE from "fp-ts/lib/TaskEither";
import {
  aUserEycaCardPending,
  cardActivatedMessageMock,
  context,
  enqueueMessageMock,
  eycaFindLastVersionByModelIdMock,
  eycaUpdateModelMock,
  queueStorageMock,
  updateCcdbEycaCardMock,
  userEycaCardModelMock
} from "../../__mocks__/mock";
import { handler } from "../handler";
import { setTelemetryClient } from "../../utils/appinsights";
import { telemetryClientMock } from "../../__mocks__/mock";

setTelemetryClient(telemetryClientMock);

eycaFindLastVersionByModelIdMock.mockReturnValue(
  TE.right(aUserEycaCardPending)
);

describe("ProcessActivatedEycaQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw when query to cosmos fails", async () => {
    eycaFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.left({ kind: "COSMOS_ERROR" })
    );

    const promised = handler(
      userEycaCardModelMock,
      updateCcdbEycaCardMock,
      queueStorageMock
    )(context, cardActivatedMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot query cosmos CGN")
    );

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(updateCcdbEycaCardMock).not.toHaveBeenCalled();
    expect(eycaUpdateModelMock).not.toHaveBeenCalled();
  });

  it("should throw when update ccdb fails", async () => {
    updateCcdbEycaCardMock.mockReturnValueOnce(TE.left(new Error("Error")));

    const promised = handler(
      userEycaCardModelMock,
      updateCcdbEycaCardMock,
      queueStorageMock
    )(context, cardActivatedMessageMock);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(updateCcdbEycaCardMock).toBeCalledTimes(1);
    expect(eycaUpdateModelMock).not.toHaveBeenCalled();
  });

  it("should throw when update cosmos fails", async () => {
    eycaUpdateModelMock.mockReturnValueOnce(TE.left({ kind: "COSMOS_ERROR" }));

    const promised = handler(
      userEycaCardModelMock,
      updateCcdbEycaCardMock,
      queueStorageMock
    )(context, cardActivatedMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot update cosmos EYCA")
    );

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(updateCcdbEycaCardMock).toBeCalledTimes(1);
    expect(eycaUpdateModelMock).toBeCalledTimes(1);
  });

  it("should throw when enqueue message fails", async () => {
    enqueueMessageMock.mockReturnValueOnce(TE.left(new Error("error")));

    const promised = handler(
      userEycaCardModelMock,
      updateCcdbEycaCardMock,
      queueStorageMock
    )(context, cardActivatedMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("error")
    );

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(updateCcdbEycaCardMock).toBeCalledTimes(1);
    expect(eycaUpdateModelMock).toBeCalledTimes(1);
  });

  it("should succeed and activate a pending card", async () => {
    const promised = handler(
      userEycaCardModelMock,
      updateCcdbEycaCardMock,
      queueStorageMock
    )(context, cardActivatedMessageMock);

    await expect(promised).resolves.toStrictEqual(true);

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(updateCcdbEycaCardMock).toBeCalledTimes(1);
    expect(eycaUpdateModelMock).toBeCalledTimes(1);
  });
});
