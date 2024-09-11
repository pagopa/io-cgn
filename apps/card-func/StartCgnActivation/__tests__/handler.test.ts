/* eslint-disable @typescript-eslint/no-explicit-any */
import { toCosmosErrorResponse } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import {
  ResponseErrorInternal,
  ResponseSuccessAccepted
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { addYears } from "date-fns";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { context, mockStartNew } from "../../__mocks__/durable-functions";
import { cgnActivatedDates } from "../../__mocks__/mock";
import {
  CardActivated,
  StatusEnum as ActivatedStatusEnum
} from "../../generated/definitions/CardActivated";
import {
  CardPending,
  StatusEnum
} from "../../generated/definitions/CardPending";
import {
  CardRevoked,
  StatusEnum as RevokedStatusEnum
} from "../../generated/definitions/CardRevoked";
import { StatusEnum as PendingDeleteStatusEnum } from "../../generated/definitions/CardPendingDelete";
import { UserCgn } from "../../models/user_cgn";
import { DEFAULT_CGN_UPPER_BOUND_AGE } from "../../utils/config";
import * as orchUtils from "../../utils/orchestrators";
import { StartCgnActivationHandler } from "../handler";

const now = new Date();
const aFiscalCode = "RODFDS89S10H501T" as FiscalCode;
const anOldFiscalCode = "RODFDS82S10H501T" as FiscalCode;

const aUserCardRevoked: CardRevoked = {
  ...cgnActivatedDates,
  revocation_date: now,
  revocation_reason: "revocation_reason" as NonEmptyString,
  status: RevokedStatusEnum.REVOKED
};

const aUserCardActivated: CardActivated = {
  activation_date: new Date(),
  expiration_date: addYears(new Date(), 2),
  status: ActivatedStatusEnum.ACTIVATED
};

const aUserCardPending: CardPending = {
  status: StatusEnum.PENDING
};

const aRevokedUserCgn: UserCgn = {
  card: aUserCardRevoked,
  fiscalCode: aFiscalCode,
  id: "A_USER_CGN_ID" as NonEmptyString
};

const anActivatedUserCgn: UserCgn = {
  card: aUserCardActivated,
  fiscalCode: aFiscalCode,
  id: "A_USER_CGN_ID" as NonEmptyString
};

const findLastVersionByModelIdMock = jest
  .fn()
  .mockImplementation(() =>
    TE.of(O.some({ ...aRevokedUserCgn, card: aUserCardPending }))
  );
const upsertModelMock = jest.fn();
const userCgnModelMock = {
  findLastVersionByModelId: findLastVersionByModelIdMock,
  upsert: upsertModelMock
};

const checkUpdateCardIsRunningMock = jest.fn();
jest
  .spyOn(orchUtils, "checkUpdateCardIsRunning")
  .mockImplementation(checkUpdateCardIsRunningMock);

describe("StartCgnActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an Internal Error if an error occurs during UserCgn retrieve", async () => {
    findLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.left(toCosmosErrorResponse(new Error("query error")))
    );
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock as any,
      DEFAULT_CGN_UPPER_BOUND_AGE
    );
    const response = await startCgnActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return an Internal Error if it is not possible to check status of an other orchestrator with the same id", async () => {
    checkUpdateCardIsRunningMock.mockImplementationOnce(() =>
      TE.left(ResponseErrorInternal("Error"))
    );
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock as any,
      DEFAULT_CGN_UPPER_BOUND_AGE
    );
    const response = await startCgnActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return an Accepted response if there is another orchestrator running with the same id", async () => {
    checkUpdateCardIsRunningMock.mockImplementationOnce(() =>
      TE.left(ResponseSuccessAccepted())
    );
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock as any,
      DEFAULT_CGN_UPPER_BOUND_AGE
    );
    const response = await startCgnActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessAccepted");
  });

  it("should start a new orchestrator if there aren' t conflict on the same id", async () => {
    checkUpdateCardIsRunningMock.mockImplementationOnce(() => TE.of(false));
    upsertModelMock.mockImplementationOnce(() => TE.of({}));
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock as any,
      DEFAULT_CGN_UPPER_BOUND_AGE
    );
    await startCgnActivationHandler(context, aFiscalCode);
    expect(mockStartNew).toBeCalledTimes(1);
  });

  it("should return a Conflict Error if a CGN is already ACTIVATED", async () => {
    findLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some(anActivatedUserCgn))
    );
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock as any,
      DEFAULT_CGN_UPPER_BOUND_AGE
    );
    const response = await startCgnActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorConflict");
  });

  it("should return a Conflict Error if a CGN is PENDING_DELETE", async () => {
    findLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(
        O.some({
          ...anActivatedUserCgn,
          card: {
            ...aUserCardActivated,
            status: PendingDeleteStatusEnum.PENDING_DELETE
          }
        })
      )
    );
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock as any,
      DEFAULT_CGN_UPPER_BOUND_AGE
    );
    const response = await startCgnActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorConflict");
  });

  it("should start an Internal Error if there are errors while inserting a new Cgn in pending status", async () => {
    checkUpdateCardIsRunningMock.mockImplementationOnce(() => TE.of(false));
    upsertModelMock.mockImplementationOnce(() =>
      TE.left(new Error("Insert error"))
    );
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock as any,
      DEFAULT_CGN_UPPER_BOUND_AGE
    );
    const response = await startCgnActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorInternal");
    expect(mockStartNew).not.toHaveBeenCalled();
  });

  it("should return a Forbidden Error if a fiscal code is not eligible for CGN", async () => {
    findLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.left(toCosmosErrorResponse(new Error("query error")))
    );
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock as any,
      DEFAULT_CGN_UPPER_BOUND_AGE
    );
    const response = await startCgnActivationHandler(context, anOldFiscalCode);
    expect(response.kind).toBe("IResponseErrorForbiddenNotAuthorized");
  });
});
