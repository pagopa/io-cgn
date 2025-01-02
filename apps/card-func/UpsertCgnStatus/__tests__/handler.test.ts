/* eslint-disable @typescript-eslint/no-explicit-any */
import { toCosmosErrorResponse } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import {
  ResponseErrorInternal,
  ResponseSuccessAccepted
} from "@pagopa/ts-commons/lib/responses";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { UpsertCgnStatusHandler } from "../handler";
import {
  aFiscalCode,
  aUserCardActivated,
  aUserCardPending,
  aUserCgn,
  cgnFindLastVersionByModelIdMock,
  cgnUpsertModelMock,
  context,
  userCgnModelMock
} from "../../__mocks__/mock";
import {
  ActionEnum,
  CgnStatusUpsertRequest
} from "../../generated/definitions/CgnStatusUpsertRequest";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { setTelemetryClient } from "../../utils/appinsights";
import { telemetryClientMock } from "../../__mocks__/mock";

setTelemetryClient(telemetryClientMock);

const aCgnUpsertStatusRequest: CgnStatusUpsertRequest = {
  action: ActionEnum.REVOKE,
  revocation_reason: "aMotivation" as NonEmptyString
};

const upsertCgnStatusHandler = UpsertCgnStatusHandler(userCgnModelMock);

describe("UpsertCgnStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an Internal Error if an error occurs during UserCgn retrieve", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.left({ kind: "COSMOS_ERROR" })
    );

    const response = await upsertCgnStatusHandler(
      context,
      aFiscalCode,
      aCgnUpsertStatusRequest
    );

    expect(response.kind).toBe("IResponseErrorInternal");

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).not.toBeCalled();
  });

  it("should return Not Found if no UserCgn was found for the provided fiscal code", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValueOnce(TE.of(O.none));

    const response = await upsertCgnStatusHandler(
      context,
      aFiscalCode,
      aCgnUpsertStatusRequest
    );

    expect(response.kind).toBe("IResponseErrorNotFound");

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).not.toBeCalled();
  });

  it("should return Conflict if UserCgn found for the provided fiscal code is not active", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.of(O.some({ ...aUserCgn, card: aUserCardPending }))
    );

    const response = await upsertCgnStatusHandler(
      context,
      aFiscalCode,
      aCgnUpsertStatusRequest
    );

    expect(response.kind).toBe("IResponseErrorConflict");

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).not.toBeCalled();
  });

  it("should return Internal Error if an error occurs during UserCgn upsert", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.of(O.some({ ...aUserCgn, card: aUserCardActivated }))
    );
    cgnUpsertModelMock.mockReturnValueOnce(TE.left({ kind: "COSMOS_ERROR" }));

    const response = await upsertCgnStatusHandler(
      context,
      aFiscalCode,
      aCgnUpsertStatusRequest
    );

    expect(response.kind).toBe("IResponseErrorInternal");

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toBeCalledTimes(1);
  });

  it("should return Success Accepted if UserCgn found for the provided fiscal code is active", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.of(O.some({ ...aUserCgn, card: aUserCardActivated }))
    );

    const response = await upsertCgnStatusHandler(
      context,
      aFiscalCode,
      aCgnUpsertStatusRequest
    );

    expect(response.kind).toBe("IResponseSuccessAccepted");

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toBeCalledTimes(1);
  });
});
