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
import {
  CardActivatedMessage,
  CardPendingMessage
} from "../types/queue-message";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import { UserEycaCard, UserEycaCardModel } from "../models/user_eyca_card";
import { EycaCard } from "../generated/definitions/EycaCard";
import { EycaCardActivated } from "../generated/definitions/EycaCardActivated";
import { CcdbNumber } from "../generated/definitions/CcdbNumber";
import { EycaCardPendingDelete } from "../generated/definitions/EycaCardPendingDelete";

export const now = new Date();

export const cgnActivatedDates = {
  activation_date: now,
  expiration_date: addYears(now, 2)
};

const DEFAULT_CGN_UPPER_BOUND_AGE = 36 as NonNegativeInteger;
const DEFAULT_EYCA_UPPER_BOUND_AGE = 31 as NonNegativeInteger;

const eligibleCgnEycaYear = (new Date().getFullYear() - 19)
  .toString()
  .substring(2, 4);

const uneligibleCgnYear = (
  new Date().getFullYear() -
  DEFAULT_CGN_UPPER_BOUND_AGE -
  1
)
  .toString()
  .substring(2, 4);

const uneligibleEycaYear = (
  new Date().getFullYear() -
  DEFAULT_EYCA_UPPER_BOUND_AGE -
  1
)
  .toString()
  .substring(2, 4);

export const aFiscalCode = `RODFDS${eligibleCgnEycaYear}S10H501T` as FiscalCode;
export const aCGNUneligibleFiscalCode = `RODFDS${uneligibleCgnYear}S10H501T` as FiscalCode;
export const anEYCAUneligibleFiscalCode = `RODFDS${uneligibleEycaYear}S10H501T` as FiscalCode;

export const cardPendingMessageMock: CardPendingMessage = {
  request_id: ulid() as Ulid,
  fiscal_code: aFiscalCode,
  activation_date: new Date(),
  expiration_date: new Date(),
  status: PendingStatusEnum.PENDING
};

export const ccdbNumberMock = "A111-B222-C333-D444" as CcdbNumber;

export const cardActivatedMessageMock: CardActivatedMessage = {
  card_id: (ccdbNumberMock as unknown) as NonEmptyString,
  request_id: ulid() as Ulid,
  fiscal_code: aFiscalCode,
  activation_date: new Date(),
  expiration_date: new Date(),
  status: ActivatedStatusEnum.ACTIVATED
};

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

// mock some cgn entities
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
export const cgnFindLastVersionByModelIdMock = jest
  .fn()
  .mockImplementation(() => TE.right(O.none));

export const cgnUpsertModelMock = jest
  .fn()
  .mockImplementation(() => TE.of({ ...aUserCgn, card: aUserCardPending }));

export const cgnUpdateModelMock = jest
  .fn()
  .mockImplementation(<T>(input: T) => TE.of(input));

export const userCgnModelMock = ({
  findLastVersionByModelId: cgnFindLastVersionByModelIdMock,
  upsert: cgnUpsertModelMock,
  update: cgnUpdateModelMock
} as unknown) as UserCgnModel;

// mock some eyca card entities
export const aUserEycaCardPending: CardPending = {
  status: PendingStatusEnum.PENDING
};

export const aUserEycaCardActivated: EycaCardActivated = {
  card_number: ccdbNumberMock,
  activation_date: new Date(),
  expiration_date: addYears(new Date(), 2),
  status: ActivatedStatusEnum.ACTIVATED
};

export const aUserEycaCardPendingDelete: EycaCardPendingDelete = {
  card_number: ccdbNumberMock,
  activation_date: new Date(),
  expiration_date: addYears(new Date(), 2),
  status: PendingDeleteStatusEnum.PENDING_DELETE
};

export const aUserEycaCard: UserEycaCard = {
  fiscalCode: aFiscalCode,
  card: {} as EycaCard
};

// mock user eyca card model
export const eycaFindLastVersionByModelIdMock = jest
  .fn()
  .mockImplementation(() => TE.right(O.none));

export const eycaUpsertModelMock = jest
  .fn()
  .mockImplementation(() =>
    TE.of({ ...aUserEycaCard, card: aUserEycaCardPending })
  );

export const eycaUpdateModelMock = jest
  .fn()
  .mockImplementation(<T>(input: T) => TE.of(input));

export const userEycaCardModelMock = ({
  findLastVersionByModelId: eycaFindLastVersionByModelIdMock,
  upsert: eycaUpsertModelMock,
  update: eycaUpdateModelMock
} as unknown) as UserEycaCardModel;

// mock interaction with ccdb
export const preIssueEycaCardMock = jest
  .fn()
  .mockImplementation(() => TE.right(ccdbNumberMock));

export const updateCcdbEycaCardMock = jest
  .fn()
  .mockImplementation(() => TE.right("responsemock"));

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
export const storeCardExpirationMock = jest
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

export const enqueuePendingEYCAMessageMock = jest
  .fn()
  .mockImplementation(() => TE.right(true));

export const enqueueActivatedEYCAMessageMock = jest
  .fn()
  .mockReturnValue(TE.right(true));

export const queueStorageMock = ({
  enqueuePendingCGNMessage: enqueuePendingCGNMessageMock,
  enqueueActivatedCGNMessage: enqueueActivatedCGNMessageMock,
  enqueuePendingEYCAMessage: enqueuePendingEYCAMessageMock,
  enqueueActivatedEYCAMessage: enqueueActivatedEYCAMessageMock
} as unknown) as QueueStorage;
