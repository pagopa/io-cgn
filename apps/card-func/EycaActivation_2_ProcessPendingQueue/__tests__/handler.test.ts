import * as TE from "fp-ts/lib/TaskEither";
import {
  aUserEycaCard,
  aUserEycaCardPending,
  context,
  enqueueMessageMock,
  eycaFindLastVersionByModelIdMock,
  eycaUpsertModelMock,
  cardPendingMessageMock,
  preIssueEycaCardMock,
  queueStorageMock,
  storeCardExpirationMock,
  userEycaCardModelMock
} from "../../__mocks__/mock";
import { handler } from "../handler";

describe("ProcessPendingEycaQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw when query to cosmos fails", async () => {
    eycaFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.left({ kind: "COSMOS_ERROR" })
    );

    const promised = handler(
      userEycaCardModelMock,
      storeCardExpirationMock,
      preIssueEycaCardMock,
      queueStorageMock
    )(context, cardPendingMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot query cosmos EYCA")
    );

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).not.toHaveBeenCalled();
    expect(storeCardExpirationMock).not.toHaveBeenCalled();
    expect(preIssueEycaCardMock).not.toHaveBeenCalled();
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when upsert to cosmos fails", async () => {
    eycaUpsertModelMock.mockReturnValueOnce(
      TE.left({ kind: "COSMOS_ERROR" })
    );

    const promised = handler(
      userEycaCardModelMock,
      storeCardExpirationMock,
      preIssueEycaCardMock,
      queueStorageMock
    )(context, cardPendingMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot upsert cosmos EYCA")
    );

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).toBeCalledTimes(1);
    expect(storeCardExpirationMock).not.toHaveBeenCalled();
    expect(preIssueEycaCardMock).not.toHaveBeenCalled();
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  }); 

  it("should throw when card expiration storage fails", async () => {
    storeCardExpirationMock.mockReturnValueOnce(
      TE.left(new Error("Error"))
    );

    const promised = handler(
      userEycaCardModelMock,
      storeCardExpirationMock,
      preIssueEycaCardMock,
      queueStorageMock
    )(context, cardPendingMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("Error")
    );

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).toBeCalledTimes(1);
    expect(storeCardExpirationMock).toBeCalledTimes(1);
    expect(preIssueEycaCardMock).not.toHaveBeenCalled();
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  }); 

  it("should throw when preIssueCard fails", async () => {
    preIssueEycaCardMock.mockReturnValueOnce(
      TE.left(new Error("Error"))
    );

    const promised = handler(
      userEycaCardModelMock,
      storeCardExpirationMock,
      preIssueEycaCardMock,
      queueStorageMock
    )(context, cardPendingMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("Error")
    );

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).toBeCalledTimes(1);
    expect(storeCardExpirationMock).toBeCalledTimes(1);
    expect(preIssueEycaCardMock).toBeCalledTimes(1);
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when activated eyca message enqueue fails", async () => {
    enqueueMessageMock.mockReturnValueOnce(
      TE.left(new Error("Error"))
    );

    const promised = handler(
      userEycaCardModelMock,
      storeCardExpirationMock,
      preIssueEycaCardMock,
      queueStorageMock
    )(context, cardPendingMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("Error")
    );

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).toBeCalledTimes(1);
    expect(storeCardExpirationMock).toBeCalledTimes(1);
    expect(preIssueEycaCardMock).toBeCalledTimes(1);
    expect(enqueueMessageMock).toBeCalledTimes(1);
  });

  it("should succeed and create a new pending card when it not exists", async () => {
    const promised = handler(
      userEycaCardModelMock,
      storeCardExpirationMock,
      preIssueEycaCardMock,
      queueStorageMock
    )(context, cardPendingMessageMock);

    await expect(promised).resolves.toStrictEqual(true);

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).toBeCalledTimes(1);
    expect(storeCardExpirationMock).toBeCalledTimes(1);
    expect(preIssueEycaCardMock).toBeCalledTimes(1);
    expect(enqueueMessageMock).toBeCalledTimes(1);
  });

  it("should succeed and recover an existing eyca card when it already exists", async () => {
    eycaFindLastVersionByModelIdMock.mockReturnValueOnce(TE.of({ ...aUserEycaCard, card: aUserEycaCardPending }));

    const promised = handler(
      userEycaCardModelMock,
      storeCardExpirationMock,
      preIssueEycaCardMock,
      queueStorageMock
    )(context, cardPendingMessageMock);

    await expect(promised).resolves.toStrictEqual(true);

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).not.toBeCalled();
    expect(storeCardExpirationMock).toBeCalledTimes(1);
    expect(preIssueEycaCardMock).toBeCalledTimes(1);
    expect(enqueueMessageMock).toBeCalledTimes(1);
  });
});
