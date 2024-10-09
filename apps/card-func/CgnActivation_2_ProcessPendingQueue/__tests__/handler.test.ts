import { HttpStatusCodeEnum } from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import {
  aFiscalCode,
  aUserCardActivated,
  aUserCardPending,
  context,
  enqueueActivatedCGNMessageMock,
  findLastVersionByModelIdMock,
  makeServiceResponse,
  queueMessage,
  queueStorageMock,
  servicesClientMock,
  storeCgnExpirationMock,
  upsertModelMock,
  upsertServiceActivationMock,
  userCgnModelMock
} from "../../__mocks__/mock";
import { handler } from "../handler";

describe("ProcessActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw when query to cosmos fails", async () => {
    findLastVersionByModelIdMock.mockReturnValueOnce(
      TE.left({ kind: "COSMOS_ERROR" })
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot query cosmos CGN")
    );

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).not.toHaveBeenCalled();
    expect(upsertServiceActivationMock).not.toHaveBeenCalled();
    expect(storeCgnExpirationMock).not.toHaveBeenCalled();
    expect(enqueueActivatedCGNMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when upsert to cosmos fails", async () => {
    upsertModelMock.mockReturnValueOnce(TE.left({ kind: "COSMOS_ERROR" }));

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot upsert cosmos CGN")
    );

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).not.toHaveBeenCalled();
    expect(storeCgnExpirationMock).not.toHaveBeenCalled();
    expect(enqueueActivatedCGNMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when special service upsert throws", async () => {
    upsertServiceActivationMock.mockImplementationOnce(() => {
      throw "Error";
    });

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCgnExpirationMock).not.toHaveBeenCalled();
    expect(enqueueActivatedCGNMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when special service upsert returns non success response", async () => {
    upsertServiceActivationMock.mockImplementationOnce(() =>
      E.right(makeServiceResponse(HttpStatusCodeEnum.HTTP_STATUS_500, "Error"))
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).rejects.toStrictEqual(
      new Error("Cannot upsert service activation with response code 500")
    );

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCgnExpirationMock).not.toHaveBeenCalled();
    expect(enqueueActivatedCGNMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when expiration storage fails", async () => {
    storeCgnExpirationMock.mockReturnValueOnce(TE.left(new Error("Error")));

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCgnExpirationMock).toBeCalledTimes(1);
    expect(enqueueActivatedCGNMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when activated cgn message enqueue fails", async () => {
    enqueueActivatedCGNMessageMock.mockReturnValueOnce(
      TE.left(new Error("Error"))
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCgnExpirationMock).toBeCalledTimes(1);
    expect(enqueueActivatedCGNMessageMock).toBeCalledTimes(1);
  });

  it("should succeed and create a new pending card when it not exists", async () => {
    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).resolves.toStrictEqual(true);

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCgnExpirationMock).toBeCalledTimes(1);
    expect(enqueueActivatedCGNMessageMock).toBeCalledTimes(1);
  });

  it("should succeed and recover an existing pending card when already existing", async () => {
    findLastVersionByModelIdMock.mockReturnValueOnce(
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
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).resolves.toStrictEqual(true);

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).not.toBeCalled();
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCgnExpirationMock).toBeCalledTimes(1);
    expect(enqueueActivatedCGNMessageMock).toBeCalledTimes(1);
  });

  it("should succeed and recover an existing activated card when already existing", async () => {
    findLastVersionByModelIdMock.mockReturnValueOnce(
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
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).resolves.toStrictEqual(true);

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).not.toBeCalled();
    expect(upsertServiceActivationMock).not.toBeCalled();
    expect(storeCgnExpirationMock).not.toBeCalled();
    expect(enqueueActivatedCGNMessageMock).toBeCalledTimes(1);
  });
});
