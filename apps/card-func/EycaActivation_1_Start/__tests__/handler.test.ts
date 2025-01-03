import { toCosmosErrorResponse } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import {
  aFiscalCode,
  aUserEycaCard,
  aUserEycaCardActivated,
  aUserEycaCardPending,
  aUserEycaCardPendingDelete,
  anEYCAUneligibleFiscalCode,
  context,
  enqueueMessageMock,
  eycaFindLastVersionByModelIdMock,
  queueStorageMock,
  userEycaCardModelMock
} from "../../__mocks__/mock";
import { DEFAULT_EYCA_UPPER_BOUND_AGE } from "../../utils/config";
import { StartEycaActivationHandler } from "../handler";
import { InstanceId } from "../../generated/definitions/InstanceId";
import { setTelemetryClient } from "../../utils/appinsights";
import { telemetryClientMock } from "../../__mocks__/mock";

setTelemetryClient(telemetryClientMock);

describe("StartEycaActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an Internal Error if an error occurs during UserEycaCard retrieve", async () => {
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.left(toCosmosErrorResponse(new Error("query error")))
    );
    const startEycaActivationHandler = StartEycaActivationHandler(
      userEycaCardModelMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startEycaActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return a Conflict Error if a EYCA is already ACTIVATED", async () => {
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserEycaCard, card: aUserEycaCardActivated }))
    );
    const startEycaActivationHandler = StartEycaActivationHandler(
      userEycaCardModelMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startEycaActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorConflict");
  });

  it("should return a Conflict Error if a EYCA is PENDING_DELETE", async () => {
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserEycaCard, card: aUserEycaCardPendingDelete }))
    );
    const startEycaActivationHandler = StartEycaActivationHandler(
      userEycaCardModelMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startEycaActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorConflict");
  });

  it("should return a Forbidden Error if a fiscal code is not eligible for EYCA", async () => {
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() => TE.of(O.none));
    const startEycaActivationHandler = StartEycaActivationHandler(
      userEycaCardModelMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startEycaActivationHandler(
      context,
      anEYCAUneligibleFiscalCode
    );
    expect(response.kind).toBe("IResponseErrorForbiddenNotAuthorized");
  });

  it("should return a Redirect to Resource if EYCA activation starts", async () => {
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() => TE.of(O.none));
    const startEycaActivationHandler = StartEycaActivationHandler(
      userEycaCardModelMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startEycaActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessRedirectToResource");
    if (response.kind === "IResponseSuccessRedirectToResource") {
      expect(InstanceId.is(response.payload)).toBe(true);
    }
    expect(enqueueMessageMock).toHaveBeenCalledTimes(1);
  });

  it("should return a Redirect to Resource if EYCA activation re-starts", async () => {
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserEycaCard, card: aUserEycaCardPending }))
    );
    const startEycaActivationHandler = StartEycaActivationHandler(
      userEycaCardModelMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startEycaActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessRedirectToResource");
    if (response.kind === "IResponseSuccessRedirectToResource") {
      expect(InstanceId.is(response.payload)).toBe(true);
    }
    expect(enqueueMessageMock).toHaveBeenCalledTimes(1);
  });

  it("should fail if EYCA activation starts and queue service is not reachable", async () => {
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() => TE.of(O.none));
    enqueueMessageMock.mockImplementationOnce(() =>
      TE.left(new Error("any error"))
    );
    const startEycaActivationHandler = StartEycaActivationHandler(
      userEycaCardModelMock,
      DEFAULT_EYCA_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startEycaActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorInternal");
    expect(enqueueMessageMock).toHaveBeenCalledTimes(1);
  });
});
