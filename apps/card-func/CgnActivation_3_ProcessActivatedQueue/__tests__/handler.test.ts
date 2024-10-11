import { HttpStatusCodeEnum } from "@pagopa/ts-commons/lib/responses";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import {
  anEYCAUneligibleFiscalCode,
  aUserCardActivated,
  aUserCardPending,
  aUserCgn,
  cardActivatedMessageMock,
  cgnFindLastVersionByModelIdMock,
  cgnUpdateModelMock,
  context,
  enqueuePendingEYCAMessageMock,
  makeServiceResponse,
  queueStorageMock,
  servicesClientMock,
  upsertServiceActivationMock,
  userCgnModelMock
} from "../../__mocks__/mock";
import { toBase64 } from "../../utils/base64";
import { DEFAULT_EYCA_UPPER_BOUND_AGE } from "../../utils/config";
import { handler } from "../handler";

cgnFindLastVersionByModelIdMock.mockReturnValue(
  TE.right(O.some({ ...aUserCgn, card: aUserCardPending }))
);

describe("ProcessActivation", () => {
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
      queueStorageMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    )(context, cardActivatedMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot query cosmos CGN")
    );

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).not.toHaveBeenCalled();
    expect(cgnUpdateModelMock).not.toHaveBeenCalled();
    expect(enqueuePendingEYCAMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when query to cosmos does not find cgn card", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValueOnce(TE.right(O.none));

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      queueStorageMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    )(context, cardActivatedMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("Cannot find requested CGN")
    );

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).not.toHaveBeenCalled();
    expect(cgnUpdateModelMock).not.toHaveBeenCalled();
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
    )(context, cardActivatedMessageMock);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(cgnUpdateModelMock).not.toHaveBeenCalled();
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
    )(context, cardActivatedMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("Cannot upsert service activation with response code 500")
    );

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(cgnUpdateModelMock).not.toHaveBeenCalled();
    expect(enqueuePendingEYCAMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when update model fails", async () => {
    cgnUpdateModelMock.mockReturnValueOnce(TE.left({ kind: "COSMOS_ERROR" }));

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      queueStorageMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    )(context, cardActivatedMessageMock);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot update cosmos CGN")
    );

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(cgnUpdateModelMock).toBeCalledTimes(1);
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
    )(context, cardActivatedMessageMock);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(cgnUpdateModelMock).toBeCalledTimes(1);
    expect(enqueuePendingEYCAMessageMock).toBeCalledTimes(1);
  });

  it("should succeed and activate the cgn card and send pending eyca message if eligible", async () => {
    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      queueStorageMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    )(context, cardActivatedMessageMock);

    await expect(promised).resolves.toStrictEqual(true);

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(cgnUpdateModelMock).toBeCalledTimes(1);
    expect(enqueuePendingEYCAMessageMock).toBeCalledTimes(1);
  });

  it("should succeed and activate the cgn card and not send pending eyca message if not eligible", async () => {
    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      queueStorageMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    )(context, {
      ...cardActivatedMessageMock,
      fiscal_code: anEYCAUneligibleFiscalCode
    });

    await expect(promised).resolves.toStrictEqual(true);

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(cgnUpdateModelMock).toBeCalledTimes(1);
    expect(enqueuePendingEYCAMessageMock).not.toBeCalled();
  });

  it("should succeed without activating the cgn card if already activated and not send any eyca activation message", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.right(O.some({ ...aUserCgn, card: aUserCardActivated }))
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      queueStorageMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE
    )(context, cardActivatedMessageMock);

    await expect(promised).resolves.toStrictEqual(true);

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).not.toBeCalled();
    expect(cgnUpdateModelMock).not.toBeCalled();
    expect(enqueuePendingEYCAMessageMock).not.toBeCalled();
  });
});
