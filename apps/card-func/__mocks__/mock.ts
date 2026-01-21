import { Context } from "@azure/functions";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import { HttpStatusCodeEnum } from "@pagopa/ts-commons/lib/responses";
import {
  FiscalCode,
  NonEmptyString,
  Ulid,
} from "@pagopa/ts-commons/lib/strings";
import { TelemetryClient } from "applicationinsights";
import { ServiceResponse, TableService } from "azure-storage";
import { addYears } from "date-fns";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { ulid } from "ulid";

import { Card } from "../generated/definitions/Card";
import {
  StatusEnum as ActivatedStatusEnum,
  CardActivated,
} from "../generated/definitions/CardActivated";
import {
  CardExpired,
  StatusEnum as ExpiredStatusEnum,
} from "../generated/definitions/CardExpired";
import {
  CardPending,
  StatusEnum as PendingStatusEnum,
} from "../generated/definitions/CardPending";
import {
  CardPendingDelete,
  StatusEnum as PendingDeleteStatusEnum,
} from "../generated/definitions/CardPendingDelete";
import {
  CardRevoked,
  StatusEnum as RevokedStatusEnum,
} from "../generated/definitions/CardRevoked";
import { CcdbNumber } from "../generated/definitions/CcdbNumber";
import { EycaCard } from "../generated/definitions/EycaCard";
import { EycaCardActivated } from "../generated/definitions/EycaCardActivated";
import { EycaCardExpired } from "../generated/definitions/EycaCardExpired";
import { EycaCardPendingDelete } from "../generated/definitions/EycaCardPendingDelete";
import { ActivationStatusEnum } from "../generated/services-api/ActivationStatus";
import { createClient } from "../generated/services-api/client";
import { UserCgn, UserCgnModel } from "../models/user_cgn";
import { UserEycaCard, UserEycaCardModel } from "../models/user_eyca_card";
import {
  CardActivatedMessage,
  CardExpiredMessage,
  CardPendingDeleteMessage,
  CardPendingMessage,
} from "../types/queue-message";
import * as expirationUtils from "../utils/card_expiration";
import { QueueStorage } from "../utils/queue";

export const telemetryClientMock: TelemetryClient = {
  trackEvent: jest.fn().mockImplementation(({ name, properties }) => {
    // eslint-disable-next-line
    console.info(`Event: ${name}, Props: ${JSON.stringify(properties)}`);
  }),
  trackException: jest.fn().mockImplementation(({ exception, properties }) => {
    // eslint-disable-next-line
    console.error(
      `Exception: ${exception}, Props: ${JSON.stringify(properties)}`,
    );
  }),
} as unknown as TelemetryClient;

export const now = new Date();

export const cgnActivatedDates = {
  activation_date: now,
  expiration_date: addYears(now, 2),
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
export const aCGNUneligibleFiscalCode =
  `RODFDS${uneligibleCgnYear}S10H501T` as FiscalCode;
export const anEYCAUneligibleFiscalCode =
  `RODFDS${uneligibleEycaYear}S10H501T` as FiscalCode;

export const cardPendingMessageMock: CardPendingMessage = {
  activation_date: new Date(),
  expiration_date: new Date(),
  fiscal_code: aFiscalCode,
  request_id: ulid() as Ulid,
  status: PendingStatusEnum.PENDING,
};

export const ccdbNumberMock = "A111-B222-C333-D444" as CcdbNumber;

export const cardActivatedMessageMock: CardActivatedMessage = {
  activation_date: new Date(),
  card_id: ccdbNumberMock as unknown as NonEmptyString,
  expiration_date: new Date(),
  fiscal_code: aFiscalCode,
  request_id: ulid() as Ulid,
  status: ActivatedStatusEnum.ACTIVATED,
};

export const cardPendingDeleteMessageMock: CardPendingDeleteMessage = {
  expiration_date: new Date(),
  fiscal_code: aFiscalCode,
  request_id: ulid() as Ulid,
  status: PendingDeleteStatusEnum.PENDING_DELETE,
};

export const cardExpiredMessageMock: CardExpiredMessage = {
  activation_date: new Date(),
  expiration_date: new Date(),
  fiscal_code: aFiscalCode,
  request_id: ulid() as Ulid,
  status: ExpiredStatusEnum.EXPIRED,
};

export const context = {
  log: {
    error: jest.fn().mockImplementation((e) => {
      // eslint-disable-next-line
      console.log(e);
    }),
  },
} as unknown as Context;

export const makeServiceResponse = (
  status: HttpStatusCodeEnum,
  value: string,
) => ({
  headers: [],
  status,
  value,
});

// mock some cgn entities
export const aUserCardPending: CardPending = {
  status: PendingStatusEnum.PENDING,
};

export const aUserCardActivated: CardActivated = {
  activation_date: new Date(),
  expiration_date: addYears(new Date(), 2),
  status: ActivatedStatusEnum.ACTIVATED,
};

export const aUserCardPendingDelete: CardPendingDelete = {
  activation_date: new Date(),
  expiration_date: addYears(new Date(), 2),
  status: PendingDeleteStatusEnum.PENDING_DELETE,
};

export const aUserCardRevoked: CardRevoked = {
  ...cgnActivatedDates,
  revocation_date: now,
  revocation_reason: "revocation_reason" as NonEmptyString,
  status: RevokedStatusEnum.REVOKED,
};

export const aUserCardExpired: CardExpired = {
  ...cgnActivatedDates,
  status: ExpiredStatusEnum.EXPIRED,
};

export const aUserCgn: UserCgn = {
  card: {} as Card,
  fiscalCode: aFiscalCode,
  id: "A_USER_CGN_ID" as NonEmptyString,
};

// mock user cgn model
export const cgnFindLastVersionByModelIdMock = jest
  .fn()
  .mockImplementation(() => TE.right(O.none));

export const cgnFindAllCgnCardsModelMock = jest
  .fn()
  .mockImplementation(() =>
    TE.right([{ ...aUserCgn, card: aUserCardActivated }]),
  );

export const cgnUpsertModelMock = jest
  .fn()
  .mockImplementation(() => TE.of({ ...aUserCgn, card: aUserCardPending }));

export const cgnUpdateModelMock = jest
  .fn()
  .mockImplementation(<T>(input: T) => TE.of(input));

export const cgnDeleteVersionModelMock = jest
  .fn()
  .mockImplementation(() => TE.of("Delete success"));

export const userCgnModelMock = {
  deleteVersion: cgnDeleteVersionModelMock,
  findAllCgnCards: cgnFindAllCgnCardsModelMock,
  findLastVersionByModelId: cgnFindLastVersionByModelIdMock,
  update: cgnUpdateModelMock,
  upsert: cgnUpsertModelMock,
} as unknown as UserCgnModel;

// mock some eyca card entities
export const aUserEycaCardPending: CardPending = {
  status: PendingStatusEnum.PENDING,
};

export const aUserEycaCardActivated: EycaCardActivated = {
  activation_date: new Date(),
  card_number: ccdbNumberMock,
  expiration_date: addYears(new Date(), 2),
  status: ActivatedStatusEnum.ACTIVATED,
};

export const aUserEycaCardPendingDelete: EycaCardPendingDelete = {
  activation_date: new Date(),
  card_number: ccdbNumberMock,
  expiration_date: addYears(new Date(), 2),
  status: PendingDeleteStatusEnum.PENDING_DELETE,
};

export const aUserEycaCardExpired: EycaCardExpired = {
  activation_date: new Date(),
  card_number: ccdbNumberMock,
  expiration_date: addYears(new Date(), 2),
  status: ExpiredStatusEnum.EXPIRED,
};

export const aUserEycaCard: UserEycaCard = {
  card: {} as EycaCard,
  fiscalCode: aFiscalCode,
  id: "A_USER_EYCA_CARD_ID" as NonEmptyString,
};

// mock user eyca card model
export const eycaFindLastVersionByModelIdMock = jest
  .fn()
  .mockImplementation(() => TE.right(O.none));

export const eycaFindAllEycaCardsModelMock = jest
  .fn()
  .mockImplementation(() =>
    TE.right([{ ...aUserEycaCard, card: aUserEycaCardActivated }]),
  );

export const eycaUpsertModelMock = jest
  .fn()
  .mockImplementation(() =>
    TE.of({ ...aUserEycaCard, card: aUserEycaCardPending }),
  );

export const eycaUpdateModelMock = jest
  .fn()
  .mockImplementation(<T>(input: T) => TE.of(input));

export const eycaDeleteVersionModelMock = jest
  .fn()
  .mockImplementation(() => TE.of("Delete success"));

export const userEycaCardModelMock = {
  deleteVersion: eycaDeleteVersionModelMock,
  findAllEycaCards: eycaFindAllEycaCardsModelMock,
  findLastVersionByModelId: eycaFindLastVersionByModelIdMock,
  update: eycaUpdateModelMock,
  upsert: eycaUpsertModelMock,
} as unknown as UserEycaCardModel;

// mock interaction with ccdb
export const preIssueEycaCardMock = jest
  .fn()
  .mockImplementation(() => TE.right(ccdbNumberMock));

export const updateCcdbEycaCardMock = jest
  .fn()
  .mockImplementation(() => TE.right("responsemock"));

export const deleteCcdbEycaCardMock = jest
  .fn()
  .mockImplementation(() => TE.right("responsemock"));

// mock services api client
export const upsertServiceActivationMock = jest.fn().mockImplementation(() =>
  E.right(
    makeServiceResponse(
      HttpStatusCodeEnum.HTTP_STATUS_200,
      JSON.stringify({
        fiscal_code: aFiscalCode,
        service_id: "qwertyuiop",
        status: ActivationStatusEnum.PENDING,
        version: 1,
      }),
    ),
  ),
);

export const fakeServicesAPIClient = createClient<"SubscriptionKey">({
  baseUrl: "",
  fetchApi: async () => new Response(),
  withDefaults: (op) => (params) => op({ SubscriptionKey: "", ...params }),
});

export const servicesClientMock = {
  ...fakeServicesAPIClient,
  upsertServiceActivation: upsertServiceActivationMock,
};

// mock storage
export const storeCardExpirationMock = jest
  .fn()
  .mockImplementation(() => TE.right({} as unknown as ServiceResponse));

export const deleteCardExpirationMock = jest
  .fn()
  .mockImplementation(() =>
    TE.right({} as unknown as TableService.EntityMetadata),
  );

// mock queue storage
export const enqueueMessageMock = jest
  .fn()
  .mockImplementation(() => TE.right(true));

export const queueStorageMock = {
  enqueueActivatedCGNMessage: enqueueMessageMock,
  enqueueActivatedEYCAMessage: enqueueMessageMock,
  enqueueExpiredCGNMessage: enqueueMessageMock,
  enqueueExpiredEYCAMessage: enqueueMessageMock,
  enqueueMessageToSendMessage: enqueueMessageMock,
  enqueuePendingCGNMessage: enqueueMessageMock,
  enqueuePendingDeleteCGNMessage: enqueueMessageMock,
  enqueuePendingDeleteEYCAMessage: enqueueMessageMock,
  enqueuePendingEYCAMessage: enqueueMessageMock,
} as unknown as QueueStorage;

// expirations

export const activationAndExpirationDates = {
  activationDate: cgnActivatedDates.activation_date,
  expirationDate: cgnActivatedDates.expiration_date,
};

export const aSetOfExpiredRows: expirationUtils.ExpiredCardRowKey[] = [
  {
    fiscalCode: "RODFDS82S10H501T" as FiscalCode,
    ...activationAndExpirationDates,
  },
  {
    fiscalCode: "RODEDS80S10H501T" as FiscalCode,
    ...activationAndExpirationDates,
  },
];

export const expiredCgnTableName = "aTable" as NonEmptyString;

export const getExpiredCardUsersFunctionMock = jest
  .fn()
  .mockReturnValue(TE.of(aSetOfExpiredRows));
