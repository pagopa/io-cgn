/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context } from "@azure/functions";
import { toCosmosErrorResponse } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { addYears } from "date-fns";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { cgnActivatedDates } from "../../__mocks__/mock";
import {
  StatusEnum as ActivatedStatusEnum,
  CardActivated
} from "../../generated/definitions/CardActivated";
import {
  CardPending,
  StatusEnum
} from "../../generated/definitions/CardPending";
import { StatusEnum as PendingDeleteStatusEnum } from "../../generated/definitions/CardPendingDelete";
import {
  CardRevoked,
  StatusEnum as RevokedStatusEnum
} from "../../generated/definitions/CardRevoked";
import { UserCgn } from "../../models/user_cgn";
import { StartCgnActivationHandler } from "../handler";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import { QueueStorage } from "../../utils/queue";

const now = new Date();
const aFiscalCode = "RODFDS99S10H501T" as FiscalCode;
const anOldFiscalCode = "RODFDS82S10H501T" as FiscalCode;
const DEFAULT_CGN_UPPER_BOUND_AGE = 36 as NonNegativeInteger;

const context = ({
  log: {
    error: jest.fn().mockImplementation(e => {
      console.log(e);
    })
  }
} as unknown) as Context;

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

const enqueuePendingCGNMessageMock = jest
  .fn()
  .mockImplementation(() => TE.right(true));
const queueStorageMock = ({
  enqueuePendingCGNMessage: enqueuePendingCGNMessageMock
} as unknown) as QueueStorage;

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
      DEFAULT_CGN_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startCgnActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return a Conflict Error if a CGN is already ACTIVATED", async () => {
    findLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some(anActivatedUserCgn))
    );
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock as any,
      DEFAULT_CGN_UPPER_BOUND_AGE,
      queueStorageMock
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
      DEFAULT_CGN_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startCgnActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorConflict");
  });

  it("should return a Forbidden Error if a fiscal code is not eligible for CGN", async () => {
    findLastVersionByModelIdMock.mockImplementationOnce(() => TE.of(O.none));
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock as any,
      DEFAULT_CGN_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startCgnActivationHandler(context, anOldFiscalCode);
    expect(response.kind).toBe("IResponseErrorForbiddenNotAuthorized");
  });

  it("should return a Redirect to Resource if CGN activation starts", async () => {
    findLastVersionByModelIdMock.mockImplementationOnce(() => TE.of(O.none));
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock as any,
      DEFAULT_CGN_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startCgnActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessRedirectToResource");
    expect(enqueuePendingCGNMessageMock).toHaveBeenCalledTimes(1);
  });

  it("should return a Redirect to Resource if CGN activation re-starts", async () => {
    findLastVersionByModelIdMock.mockImplementationOnce(() => TE.of(O.some({ ...anActivatedUserCgn, card: aUserCardPending })));
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock as any,
      DEFAULT_CGN_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startCgnActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessRedirectToResource");
    expect(enqueuePendingCGNMessageMock).toHaveBeenCalledTimes(1);
  });

  it("should fail if CGN activation starts and queue service is not reachable", async () => {
    findLastVersionByModelIdMock.mockImplementationOnce(() => TE.of(O.none));
    enqueuePendingCGNMessageMock.mockImplementationOnce(() =>
      TE.left(new Error("any error"))
    );
    const startCgnActivationHandler = StartCgnActivationHandler(
      userCgnModelMock as any,
      DEFAULT_CGN_UPPER_BOUND_AGE,
      queueStorageMock
    );
    const response = await startCgnActivationHandler(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorInternal");
    expect(enqueuePendingCGNMessageMock).toHaveBeenCalledTimes(1);
  });
});
