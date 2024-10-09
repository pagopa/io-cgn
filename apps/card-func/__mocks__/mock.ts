import {
  FiscalCode,
  NonEmptyString,
  Ulid
} from "@pagopa/ts-commons/lib/strings";
import { addYears } from "date-fns";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { QueueStorage } from "../utils/queue";
import { TableService } from "azure-storage";
import { createClient } from "../generated/services-api/client";
import { ActivationStatusEnum } from "../generated/services-api/ActivationStatus";
import { HttpStatusCodeEnum } from "@pagopa/ts-commons/lib/responses";
import { UserCgn, UserCgnModel } from "../models/user_cgn";
import {
  StatusEnum as PendingDeleteStatusEnum,
  CardPendingDelete
} from "../generated/definitions/CardPendingDelete";
import {
  StatusEnum as ActivatedStatusEnum,
  CardActivated
} from "../generated/definitions/CardActivated";
import {
  CardPending,
  StatusEnum as PendingStatusEnum
} from "../generated/definitions/CardPending";
import { toBase64 } from "../utils/base64";
import { ulid } from "ulid";
import { Context } from "@azure/functions";
import {
  CardRevoked,
  StatusEnum as RevokedStatusEnum
} from "../generated/definitions/CardRevoked";
import { Card } from "../generated/definitions/Card";

export const now = new Date();

export const cgnActivatedDates = {
  activation_date: now,
  expiration_date: addYears(now, 2)
};

export const aFiscalCode = "RODFDS05S10H501T" as FiscalCode;
export const anUneligibleFiscalCode = "RODFDS80S10H501T" as FiscalCode;

export const queueMessage: string = toBase64({
  request_id: ulid() as Ulid,
  fiscal_code: aFiscalCode,
  activation_date: new Date(),
  expiration_date: new Date(),
  status: PendingStatusEnum.PENDING
});

export const context = ({
  log: {
    error: jest.fn().mockImplementation(e => {
      console.log(e);
    })
  }
} as unknown) as Context;

export const makeServiceResponse = (
  status: HttpStatusCodeEnum,
  value: string
) => ({
  status,
  value,
  headers: []
});

export const aUserCardPending: CardPending = {
  status: PendingStatusEnum.PENDING
};

export const aUserCardActivated: CardActivated = {
  activation_date: new Date(),
  expiration_date: addYears(new Date(), 2),
  status: ActivatedStatusEnum.ACTIVATED
};

export const aUserCardPendingDelete: CardPendingDelete = {
  activation_date: new Date(),
  expiration_date: addYears(new Date(), 2),
  status: PendingDeleteStatusEnum.PENDING_DELETE
};

export const aUserCardRevoked: CardRevoked = {
  ...cgnActivatedDates,
  revocation_date: now,
  revocation_reason: "revocation_reason" as NonEmptyString,
  status: RevokedStatusEnum.REVOKED
};

export const aUserCgn: UserCgn = {
  fiscalCode: aFiscalCode,
  id: "A_USER_CGN_ID" as NonEmptyString,
  card: {} as Card
};

// mock user cgn model
export const findLastVersionByModelIdMock = jest
  .fn()
  .mockImplementation(() => TE.right(O.none));

export const upsertModelMock = jest
  .fn()
  .mockImplementation(() => TE.of({ ...aUserCgn, card: aUserCardPending }));

export const userCgnModelMock = ({
  findLastVersionByModelId: findLastVersionByModelIdMock,
  upsert: upsertModelMock
} as unknown) as UserCgnModel;

// mock services api client
export const upsertServiceActivationMock = jest.fn().mockImplementation(() =>
  E.right(
    makeServiceResponse(
      HttpStatusCodeEnum.HTTP_STATUS_200,
      JSON.stringify({
        service_id: "qwertyuiop",
        fiscal_code: aFiscalCode,
        status: ActivationStatusEnum.PENDING,
        version: 1
      })
    )
  )
);

export const fakeServicesAPIClient = createClient<"SubscriptionKey">({
  baseUrl: "",
  fetchApi: async () => new Response(),
  withDefaults: op => params => op({ SubscriptionKey: "", ...params })
});

export const servicesClientMock = {
  ...fakeServicesAPIClient,
  upsertServiceActivation: upsertServiceActivationMock
};

// mock storage
export const storeCgnExpirationMock = jest
  .fn()
  .mockImplementation(() =>
    TE.right(({} as unknown) as TableService.EntityMetadata)
  );

// mock queue storage
export const enqueuePendingCGNMessageMock = jest
  .fn()
  .mockImplementation(() => TE.right(true));

export const enqueueActivatedCGNMessageMock = jest
  .fn()
  .mockReturnValue(TE.right(true));

export const queueStorageMock = ({
  enqueuePendingCGNMessage: enqueuePendingCGNMessageMock,
  enqueueActivatedCGNMessage: enqueueActivatedCGNMessageMock
} as unknown) as QueueStorage;
