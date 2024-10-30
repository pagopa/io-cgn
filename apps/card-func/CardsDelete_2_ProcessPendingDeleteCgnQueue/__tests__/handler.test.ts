import { HttpStatusCodeEnum } from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import {
  aFiscalCode,
  aUserCardActivated,
  aUserCardExpired,
  aUserCardPendingDelete,
  aUserCardRevoked,
  aUserCgn,
  cardPendingDeleteMessageMock,
  cgnDeleteVersionModelMock,
  cgnFindAllCgnCardsModelMock,
  cgnFindLastVersionByModelIdMock,
  cgnUpsertModelMock,
  context,
  deleteCardExpirationMock,
  makeServiceResponse,
  servicesClientMock,
  upsertServiceActivationMock,
  userCgnModelMock
} from "../../__mocks__/mock";
import { handler } from "../handler";

// mock return values for this test
cgnFindLastVersionByModelIdMock.mockReturnValue(
  TE.right(
    O.some({
      ...aUserCgn,
      card: aUserCardActivated
    })
  )
);

cgnUpsertModelMock.mockReturnValue(
  TE.right(
    O.some({
      ...aUserCgn,
      card: aUserCardPendingDelete
    })
  )
);

describe("ProcessPendingDeleteCgnQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw when query to cosmos fails", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.left({ kind: "COSMOS_ERROR" })
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      deleteCardExpirationMock
    )(context, cardPendingDeleteMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot query cosmos CGN")
    );

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).not.toHaveBeenCalled();
    expect(deleteCardExpirationMock).not.toHaveBeenCalled();
    expect(cgnFindAllCgnCardsModelMock).not.toHaveBeenCalled();
    expect(cgnDeleteVersionModelMock).not.toHaveBeenCalled();
    expect(upsertServiceActivationMock).not.toHaveBeenCalled();
  });

  it("should throw when upsert to cosmos fails", async () => {
    cgnUpsertModelMock.mockReturnValueOnce(TE.left({ kind: "COSMOS_ERROR" }));

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      deleteCardExpirationMock
    )(context, cardPendingDeleteMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot upsert cosmos CGN")
    );

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toHaveBeenCalledTimes(1);
    expect(deleteCardExpirationMock).not.toHaveBeenCalled();
    expect(cgnFindAllCgnCardsModelMock).not.toHaveBeenCalled();
    expect(cgnDeleteVersionModelMock).not.toHaveBeenCalled();
    expect(upsertServiceActivationMock).not.toHaveBeenCalled();
  });

  it("should throw when special service upsert throws", async () => {
    upsertServiceActivationMock.mockImplementationOnce(() => {
      throw "Error";
    });

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      deleteCardExpirationMock
    )(context, cardPendingDeleteMessageMock);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toHaveBeenCalledTimes(1);
    expect(deleteCardExpirationMock).not.toHaveBeenCalled();
    expect(cgnFindAllCgnCardsModelMock).not.toHaveBeenCalled();
    expect(cgnDeleteVersionModelMock).not.toHaveBeenCalled();
    expect(upsertServiceActivationMock).toHaveBeenCalledTimes(1);
  });

  it("should throw when special service upsert returns non success response", async () => {
    upsertServiceActivationMock.mockImplementationOnce(() =>
      E.right(makeServiceResponse(HttpStatusCodeEnum.HTTP_STATUS_500, "Error"))
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      deleteCardExpirationMock
    )(context, cardPendingDeleteMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("Cannot upsert service with response code 500")
    );

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toHaveBeenCalledTimes(1);
    expect(deleteCardExpirationMock).not.toHaveBeenCalled();
    expect(cgnFindAllCgnCardsModelMock).not.toHaveBeenCalled();
    expect(cgnDeleteVersionModelMock).not.toHaveBeenCalled();
    expect(upsertServiceActivationMock).toHaveBeenCalledTimes(1);
  });

  it("should throw when expiration deletion fails", async () => {
    deleteCardExpirationMock.mockReturnValueOnce(TE.left(new Error("Error")));

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      deleteCardExpirationMock
    )(context, cardPendingDeleteMessageMock);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toHaveBeenCalledTimes(1);
    expect(deleteCardExpirationMock).toHaveBeenCalledTimes(1);
    expect(cgnFindAllCgnCardsModelMock).not.toHaveBeenCalled();
    expect(cgnDeleteVersionModelMock).not.toHaveBeenCalled();
    expect(upsertServiceActivationMock).toHaveBeenCalledTimes(1);
  });

  it("should succeed when cgn card not exists", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValueOnce(TE.right(O.none));

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      deleteCardExpirationMock
    )(context, cardPendingDeleteMessageMock);

    await expect(promised).resolves.toStrictEqual(true);

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).not.toHaveBeenCalled();
    expect(deleteCardExpirationMock).not.toHaveBeenCalled();
    expect(cgnFindAllCgnCardsModelMock).not.toHaveBeenCalled();
    expect(cgnDeleteVersionModelMock).not.toHaveBeenCalled();
    expect(upsertServiceActivationMock).not.toHaveBeenCalled();
  });

  it("should succeed and delete cards when existing in activated status", async () => {
    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      deleteCardExpirationMock
    )(context, cardPendingDeleteMessageMock);

    await expect(promised).resolves.toStrictEqual(true);

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toHaveBeenCalledTimes(1);
    expect(deleteCardExpirationMock).toHaveBeenCalledTimes(1);
    expect(cgnFindAllCgnCardsModelMock).toHaveBeenCalledTimes(1);
    expect(cgnDeleteVersionModelMock).toHaveBeenCalledTimes(1);
    expect(upsertServiceActivationMock).toHaveBeenCalledTimes(2);
  });

  it("should succeed and delete cards when existing in revoked status", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValue(
      TE.right(
        O.some({
          ...aUserCgn,
          card: aUserCardRevoked
        })
      )
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      deleteCardExpirationMock
    )(context, cardPendingDeleteMessageMock);

    await expect(promised).resolves.toStrictEqual(true);

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toHaveBeenCalledTimes(1);
    expect(deleteCardExpirationMock).toHaveBeenCalledTimes(1);
    expect(cgnFindAllCgnCardsModelMock).toHaveBeenCalledTimes(1);
    expect(cgnDeleteVersionModelMock).toHaveBeenCalledTimes(1);
    expect(upsertServiceActivationMock).toHaveBeenCalledTimes(2);
  });

  it("should succeed and delete cards when existing in expired status", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValue(
      TE.right(
        O.some({
          ...aUserCgn,
          card: aUserCardExpired
        })
      )
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      deleteCardExpirationMock
    )(context, cardPendingDeleteMessageMock);

    await expect(promised).resolves.toStrictEqual(true);

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toHaveBeenCalledTimes(1);
    expect(deleteCardExpirationMock).toHaveBeenCalledTimes(1);
    expect(cgnFindAllCgnCardsModelMock).toHaveBeenCalledTimes(1);
    expect(cgnDeleteVersionModelMock).toHaveBeenCalledTimes(1);
    expect(upsertServiceActivationMock).toHaveBeenCalledTimes(2);
  });

  it("should succeed and delete cards when existing in pending_delete status", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValue(
      TE.right(
        O.some({
          ...aUserCgn,
          card: aUserCardPendingDelete
        })
      )
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      deleteCardExpirationMock
    )(context, cardPendingDeleteMessageMock);

    await expect(promised).resolves.toStrictEqual(true);

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).not.toHaveBeenCalled();
    expect(deleteCardExpirationMock).toHaveBeenCalledTimes(1);
    expect(cgnFindAllCgnCardsModelMock).toHaveBeenCalledTimes(1);
    expect(cgnDeleteVersionModelMock).toHaveBeenCalledTimes(1);
    expect(upsertServiceActivationMock).toHaveBeenCalledTimes(2);
  });
});
