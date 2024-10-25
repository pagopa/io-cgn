import { toCosmosErrorResponse } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import {
  aFiscalCode,
  aCGNUneligibleFiscalCode,
  aUserCardActivated,
  aUserCardPending,
  aUserCardPendingDelete,
  aUserCgn,
  context,
  enqueueMessageMock,
  cgnFindLastVersionByModelIdMock,
  queueStorageMock,
  userCgnModelMock
} from "../../__mocks__/mock";
import { StartCgnActivationHandler } from "../handler";
import { DEFAULT_CGN_UPPER_BOUND_AGE } from "../../utils/config";

describe("StartCgnActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an Internal Error if an error occurs during UserCgn retrieve", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.left(toCosmosErrorResponse(new Error("query error")))
    );
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock,
      DEFAULT_CGN_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startCgnActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return a Conflict Error if a CGN is already ACTIVATED", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserCgn, card: aUserCardActivated }))
    );
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock,
      DEFAULT_CGN_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startCgnActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorConflict");
  });

  it("should return a Conflict Error if a CGN is PENDING_DELETE", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserCgn, card: aUserCardPendingDelete }))
    );
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock,
      DEFAULT_CGN_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startCgnActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorConflict");
  });

  it("should return a Forbidden Error if a fiscal code is not eligible for CGN", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() => TE.of(O.none));
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock,
      DEFAULT_CGN_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startCgnActivationHandler(
      context,
      aCGNUneligibleFiscalCode
    );
    expect(response.kind).toBe("IResponseErrorForbiddenNotAuthorized");
  });

  it("should return a Redirect to Resource if CGN activation starts", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() => TE.of(O.none));
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock,
      DEFAULT_CGN_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startCgnActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessRedirectToResource");
    expect(enqueueMessageMock).toHaveBeenCalledTimes(1);
  });

  it("should return a Redirect to Resource if CGN activation re-starts", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserCgn, card: aUserCardPending }))
    );
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock as any,
      DEFAULT_CGN_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startCgnActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessRedirectToResource");
    expect(enqueueMessageMock).toHaveBeenCalledTimes(1);
  });

  it("should fail if CGN activation starts and queue service is not reachable", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() => TE.of(O.none));
    enqueueMessageMock.mockImplementationOnce(() =>
      TE.left(new Error("any error"))
    );
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock as any,
      DEFAULT_CGN_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startCgnActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorInternal");
    expect(enqueueMessageMock).toHaveBeenCalledTimes(1);
  });
});
