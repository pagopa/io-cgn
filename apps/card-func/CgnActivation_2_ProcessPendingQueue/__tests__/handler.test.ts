import { HttpStatusCodeEnum } from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import {
  aFiscalCode,
  aUserCardActivated,
  aUserCardPending,
  cgnFindLastVersionByModelIdMock,
  cgnUpsertModelMock,
  context,
  enqueueMessageMock,
  makeServiceResponse,
  cardPendingMessageMock,
  queueStorageMock,
  servicesClientMock,
  storeCardExpirationMock,
  upsertServiceActivationMock,
  userCgnModelMock
} from "../../__mocks__/mock";
import { handler } from "../handler";

describe("ProcessPendingCgnQueue", () => {
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
      storeCardExpirationMock,
      queueStorageMock
    )(context, cardPendingMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot query cosmos CGN")
    );

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).not.toHaveBeenCalled();
    expect(upsertServiceActivationMock).not.toHaveBeenCalled();
    expect(storeCardExpirationMock).not.toHaveBeenCalled();
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when upsert to cosmos fails", async () => {
    cgnUpsertModelMock.mockReturnValueOnce(TE.left({ kind: "COSMOS_ERROR" }));

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCardExpirationMock,
      queueStorageMock
    )(context, cardPendingMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot upsert cosmos CGN")
    );

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).not.toHaveBeenCalled();
    expect(storeCardExpirationMock).not.toHaveBeenCalled();
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when special service upsert throws", async () => {
    upsertServiceActivationMock.mockImplementationOnce(() => {
      throw "Error";
    });

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCardExpirationMock,
      queueStorageMock
    )(context, cardPendingMessageMock);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCardExpirationMock).not.toHaveBeenCalled();
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when special service upsert returns non success response", async () => {
    upsertServiceActivationMock.mockImplementationOnce(() =>
      E.right(makeServiceResponse(HttpStatusCodeEnum.HTTP_STATUS_500, "Error"))
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCardExpirationMock,
      queueStorageMock
    )(context, cardPendingMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("Cannot upsert service activation with response code 500")
    );

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCardExpirationMock).not.toHaveBeenCalled();
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when expiration storage fails", async () => {
    storeCardExpirationMock.mockReturnValueOnce(TE.left(new Error("Error")));

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCardExpirationMock,
      queueStorageMock
    )(context, cardPendingMessageMock);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCardExpirationMock).toBeCalledTimes(1);
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when activated cgn message enqueue fails", async () => {
    enqueueMessageMock.mockReturnValueOnce(
      TE.left(new Error("Error"))
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCardExpirationMock,
      queueStorageMock
    )(context, cardPendingMessageMock);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCardExpirationMock).toBeCalledTimes(1);
    expect(enqueueMessageMock).toBeCalledTimes(1);
  });

  it("should succeed and create a new pending card when it not exists", async () => {
    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCardExpirationMock,
      queueStorageMock
    )(context, cardPendingMessageMock);

    await expect(promised).resolves.toStrictEqual(true);

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCardExpirationMock).toBeCalledTimes(1);
    expect(enqueueMessageMock).toBeCalledTimes(1);
  });

  it("should succeed and recover an existing pending card when already existing", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.right(
        O.some({
          fiscalCode: aFiscalCode,
          id: "A_USER_CGN_ID" as NonEmptyString,
          card: aUserCardPending
        })
      )
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCardExpirationMock,
      queueStorageMock
    )(context, cardPendingMessageMock);

    await expect(promised).resolves.toStrictEqual(true);

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).not.toBeCalled();
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCardExpirationMock).toBeCalledTimes(1);
    expect(enqueueMessageMock).toBeCalledTimes(1);
  });

  it("should succeed and recover an existing activated card when already existing", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.right(
        O.some({
          fiscalCode: aFiscalCode,
          id: "A_USER_CGN_ID" as NonEmptyString,
          card: aUserCardActivated
        })
      )
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCardExpirationMock,
      queueStorageMock
    )(context, cardPendingMessageMock);

    await expect(promised).resolves.toStrictEqual(true);

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).not.toBeCalled();
    expect(upsertServiceActivationMock).not.toBeCalled();
    expect(storeCardExpirationMock).not.toBeCalled();
    expect(enqueueMessageMock).toBeCalledTimes(1);
  });
});
