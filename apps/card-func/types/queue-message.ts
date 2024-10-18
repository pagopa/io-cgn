import {
  FiscalCode,
  NonEmptyString,
  Ulid
} from "@pagopa/ts-commons/lib/strings";
import { Card } from "../generated/definitions/Card";
import {
  StatusEnum as ActivatedStatusEnum
} from "../generated/definitions/CardActivated";
import { StatusEnum as ExpiredStatusEnum } from "../generated/definitions/CardExpired";
import { StatusEnum as PendingStatusEnum } from "../generated/definitions/CardPending";
import { StatusEnum as PendingDeleteStatusEnum } from "../generated/definitions/CardPendingDelete";
import { CcdbNumber } from "../generated/definitions/CcdbNumber";
import { EycaCard } from "../generated/definitions/EycaCard";
import { MessageTypeEnum } from "../utils/messages";

type CardMessage = {
  request_id: Ulid;
  fiscal_code: FiscalCode;
  activation_date: Date;
  expiration_date: Date;
};

export type CardPendingMessage = CardMessage & {
  status: PendingStatusEnum.PENDING;
};

export type CardActivatedMessage = CardMessage & {
  status: ActivatedStatusEnum.ACTIVATED;
  card_id: CcdbNumber | NonEmptyString;
};

export type CardPendingDeleteMessage = {
  request_id: Ulid;
  fiscal_code: FiscalCode;
  expiration_date: Date;
  status: PendingDeleteStatusEnum.PENDING_DELETE;
};

export type CardExpiredMessage = {
  request_id: Ulid;
  fiscal_code: FiscalCode;
  activation_date: Date;
  expiration_date: Date;
  status: ExpiredStatusEnum.EXPIRED;
};

export type MessageToSendMessage = {
  fiscal_code: FiscalCode;
  message_type: MessageTypeEnum;
  card: Card | EycaCard;
};
