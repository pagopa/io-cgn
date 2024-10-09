import { HttpStatusCodeEnum } from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import {
  aFiscalCode,
  aUserCardActivated,
  aUserCardPending,
  aUserCgn,
  context,
  enqueuePendingEYCAMessageMock,
  findLastVersionByModelIdMock,
  makeServiceResponse,
  activatedQueueMessage,
  queueStorageMock,
  servicesClientMock,
  storeCgnExpirationMock,
  updateModelMock,
  upsertModelMock,
  upsertServiceActivationMock,
  userCgnModelMock,
  cardActivatedMessageMock,
  anEYCAUneligibleFiscalCode
} from "../../__mocks__/mock";
import { handler } from "../handler";
import { toBase64 } from "../../utils/base64";
import { DEFAULT_EYCA_UPPER_BOUND_AGE } from "../../utils/config";

findLastVersionByModelIdMock.mockReturnValue(
  TE.right(O.some({ ...aUserCgn, card: aUserCardPending }))
);

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
      queueStorageMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    )(context, activatedQueueMessage);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot query cosmos CGN")
    );

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).not.toHaveBeenCalled();
    expect(updateModelMock).not.toHaveBeenCalled();
    expect(enqueuePendingEYCAMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when query to cosmos does not find cgn card", async () => {
    findLastVersionByModelIdMock.mockReturnValueOnce(TE.right(O.none));

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      queueStorageMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    )(context, activatedQueueMessage);

    await expect(promised).rejects.toStrictEqual(
      new Error("Cannot find requested CGN")
    );

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).not.toHaveBeenCalled();
    expect(updateModelMock).not.toHaveBeenCalled();
    expect(enqueuePendingEYCAMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when special service upsert throws", async () => {
    upsertServiceActivationMock.mockImplementationOnce(() => {
      throw "Error";
    });

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      queueStorageMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    )(context, activatedQueueMessage);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(updateModelMock).not.toHaveBeenCalled();
    expect(enqueuePendingEYCAMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when special service upsert returns non success response", async () => {
    upsertServiceActivationMock.mockImplementationOnce(() =>
      E.right(makeServiceResponse(HttpStatusCodeEnum.HTTP_STATUS_500, "Error"))
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      queueStorageMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    )(context, activatedQueueMessage);

    await expect(promised).rejects.toStrictEqual(
      new Error("Cannot upsert service activation with response code 500")
    );

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(updateModelMock).not.toHaveBeenCalled();
    expect(enqueuePendingEYCAMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when update model fails", async () => {
    updateModelMock.mockReturnValueOnce(TE.left({ kind: "COSMOS_ERROR" }));

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      queueStorageMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    )(context, activatedQueueMessage);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot update cosmos CGN")
    );

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(updateModelMock).toBeCalledTimes(1);
    expect(enqueuePendingEYCAMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when eyca pending message enqueue fails", async () => {
    enqueuePendingEYCAMessageMock.mockReturnValueOnce(
      TE.left(new Error("Error"))
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      queueStorageMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    )(context, activatedQueueMessage);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(updateModelMock).toBeCalledTimes(1);
    expect(enqueuePendingEYCAMessageMock).toBeCalledTimes(1);
  });

  it("should succeed and activate the cgn card and send pending eyca message if eligible", async () => {
    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      queueStorageMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    )(context, activatedQueueMessage);

    await expect(promised).resolves.toStrictEqual(true);

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(updateModelMock).toBeCalledTimes(1);
    expect(enqueuePendingEYCAMessageMock).toBeCalledTimes(1);
  });

  it("should succeed and activate the cgn card and not send pending eyca message if not eligible", async () => {
    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      queueStorageMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    )(
      context,
      toBase64({
        ...cardActivatedMessageMock,
        fiscal_code: anEYCAUneligibleFiscalCode
      })
    );

    await expect(promised).resolves.toStrictEqual(true);

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(updateModelMock).toBeCalledTimes(1);
    expect(enqueuePendingEYCAMessageMock).not.toBeCalled();
  });

  it("should succeed without activating the cgn card if already activated and not send any eyca activation message", async () => {
    findLastVersionByModelIdMock.mockReturnValueOnce(
      TE.right(O.some({ ...aUserCgn, card: aUserCardActivated }))
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      queueStorageMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    )(context, activatedQueueMessage);

    await expect(promised).resolves.toStrictEqual(true);

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).not.toBeCalled();
    expect(updateModelMock).not.toBeCalled();
    expect(enqueuePendingEYCAMessageMock).not.toBeCalled();
  });
});
