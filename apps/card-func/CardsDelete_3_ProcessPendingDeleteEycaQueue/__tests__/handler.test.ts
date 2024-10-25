import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import {
  aFiscalCode,
  aUserEycaCard,
  aUserEycaCardActivated,
  aUserEycaCardPending,
  cardPendingDeleteMessageMock,
  context,
  enqueueMessageMock,
  eycaFindLastVersionByModelIdMock,
  eycaUpsertModelMock,
  deleteCcdbEycaCardMock,
  deleteCardExpirationMock,
  userEycaCardModelMock,
  eycaFindAllEycaCardsModelMock,
  eycaDeleteVersionModelMock,
  aUserEycaCardPendingDelete
} from "../../__mocks__/mock";
import { handler } from "../handler";

// mock return values for this test
eycaFindLastVersionByModelIdMock.mockReturnValue(
  TE.right(
    O.some({
      fiscalCode: aFiscalCode,
      card: aUserEycaCardActivated
    })
  )
);

eycaUpsertModelMock.mockReturnValue(
  TE.of({ ...aUserEycaCard, card: aUserEycaCardPendingDelete })
);

describe("ProcessActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw when query to cosmos fails", async () => {
    eycaFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.left({ kind: "COSMOS_ERROR" })
    );

    const promised = handler(
      userEycaCardModelMock,
      deleteCardExpirationMock,
      deleteCcdbEycaCardMock
    )(context, cardPendingDeleteMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot query cosmos EYCA")
    );

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).not.toHaveBeenCalled();
    expect(deleteCcdbEycaCardMock).not.toHaveBeenCalled();
    expect(deleteCardExpirationMock).not.toHaveBeenCalled();
    expect(eycaFindAllEycaCardsModelMock).not.toHaveBeenCalled();
    expect(eycaDeleteVersionModelMock).not.toHaveBeenCalled();
  });

  it("should throw when upsert to cosmos fails", async () => {
    eycaUpsertModelMock.mockReturnValueOnce(TE.left({ kind: "COSMOS_ERROR" }));

    const promised = handler(
      userEycaCardModelMock,
      deleteCardExpirationMock,
      deleteCcdbEycaCardMock
    )(context, cardPendingDeleteMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot upsert cosmos EYCA")
    );

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).toBeCalledTimes(1);
    expect(deleteCcdbEycaCardMock).not.toHaveBeenCalled();
    expect(deleteCardExpirationMock).not.toHaveBeenCalled();
    expect(eycaFindAllEycaCardsModelMock).not.toHaveBeenCalled();
    expect(eycaDeleteVersionModelMock).not.toHaveBeenCalled();
  });

  it("should throw when deleteCcdbEycaCard fails", async () => {
    deleteCcdbEycaCardMock.mockReturnValueOnce(TE.left(new Error("Error")));

    const promised = handler(
      userEycaCardModelMock,
      deleteCardExpirationMock,
      deleteCcdbEycaCardMock
    )(context, cardPendingDeleteMessageMock);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).toBeCalledTimes(1);
    expect(deleteCcdbEycaCardMock).toBeCalledTimes(1);
    expect(deleteCardExpirationMock).not.toHaveBeenCalled();
    expect(eycaFindAllEycaCardsModelMock).not.toHaveBeenCalled();
    expect(eycaDeleteVersionModelMock).not.toHaveBeenCalled();
  });

  it("should throw when card expiration deletion fails", async () => {
    deleteCardExpirationMock.mockReturnValueOnce(TE.left(new Error("Error")));

    const promised = handler(
      userEycaCardModelMock,
      deleteCardExpirationMock,
      deleteCcdbEycaCardMock
    )(context, cardPendingDeleteMessageMock);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).toBeCalledTimes(1);
    expect(deleteCardExpirationMock).toBeCalledTimes(1);
    expect(deleteCcdbEycaCardMock).toBeCalledTimes(1);
    expect(eycaFindAllEycaCardsModelMock).not.toHaveBeenCalled();
    expect(eycaDeleteVersionModelMock).not.toHaveBeenCalled();
  });

  it("should succeed when eyca card not exists", async () => {
    eycaFindLastVersionByModelIdMock.mockReturnValueOnce(TE.right(O.none));

    const promised = handler(
      userEycaCardModelMock,
      deleteCardExpirationMock,
      deleteCcdbEycaCardMock
    )(context, cardPendingDeleteMessageMock);

    await expect(promised).resolves.toStrictEqual(true);

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).not.toHaveBeenCalled();
    expect(deleteCardExpirationMock).not.toHaveBeenCalled();
    expect(deleteCcdbEycaCardMock).not.toHaveBeenCalled();
    expect(eycaFindAllEycaCardsModelMock).not.toHaveBeenCalled();
    expect(eycaDeleteVersionModelMock).not.toHaveBeenCalled();
  });

  it("should succeed and delete cards when existing in activated status", async () => {
    const promised = handler(
      userEycaCardModelMock,
      deleteCardExpirationMock,
      deleteCcdbEycaCardMock
    )(context, cardPendingDeleteMessageMock);

    await expect(promised).resolves.toStrictEqual(true);

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).toBeCalledTimes(1);
    expect(deleteCardExpirationMock).toBeCalledTimes(1);
    expect(deleteCcdbEycaCardMock).toBeCalledTimes(1);
    expect(eycaFindAllEycaCardsModelMock).toBeCalledTimes(1);
    expect(eycaDeleteVersionModelMock).toBeCalledTimes(1);
  });

  it("should succeed and delete cards when existing in pending_delete status", async () => {
    eycaFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.right(
        O.some({
          fiscalCode: aFiscalCode,
          card: aUserEycaCardPendingDelete
        })
      )
    );

    const promised = handler(
      userEycaCardModelMock,
      deleteCardExpirationMock,
      deleteCcdbEycaCardMock
    )(context, cardPendingDeleteMessageMock);

    await expect(promised).resolves.toStrictEqual(true);

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).not.toBeCalled();
    expect(deleteCardExpirationMock).toBeCalledTimes(1);
    expect(deleteCcdbEycaCardMock).toBeCalledTimes(1);
    expect(eycaFindAllEycaCardsModelMock).toBeCalledTimes(1);
    expect(eycaDeleteVersionModelMock).toBeCalledTimes(1);
  });
});
