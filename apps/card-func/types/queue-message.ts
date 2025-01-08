import {
  FiscalCode,
  NonEmptyString,
  Ulid,
} from "@pagopa/ts-commons/lib/strings";

import { Card } from "../generated/definitions/Card";
import { StatusEnum as ActivatedStatusEnum } from "../generated/definitions/CardActivated";
import { StatusEnum as ExpiredStatusEnum } from "../generated/definitions/CardExpired";
import { StatusEnum as PendingStatusEnum } from "../generated/definitions/CardPending";
import { StatusEnum as PendingDeleteStatusEnum } from "../generated/definitions/CardPendingDelete";
import { CcdbNumber } from "../generated/definitions/CcdbNumber";
import { EycaCard } from "../generated/definitions/EycaCard";
import { MessageTypeEnum } from "../utils/messages";

interface CardMessage {
  activation_date: Date;
  expiration_date: Date;
  fiscal_code: FiscalCode;
  request_id: Ulid;
}

export type CardPendingMessage = {
  status: PendingStatusEnum.PENDING;
} & CardMessage;

export type CardActivatedMessage = {
  card_id: CcdbNumber | NonEmptyString;
  status: ActivatedStatusEnum.ACTIVATED;
} & CardMessage;

export interface CardPendingDeleteMessage {
  expiration_date: Date;
  fiscal_code: FiscalCode;
  request_id: Ulid;
  status: PendingDeleteStatusEnum.PENDING_DELETE;
}

export interface CardExpiredMessage {
  activation_date: Date;
  expiration_date: Date;
  fiscal_code: FiscalCode;
  request_id: Ulid;
  status: ExpiredStatusEnum.EXPIRED;
}

export interface MessageToSendMessage {
  card: Card | EycaCard;
  fiscal_code: FiscalCode;
  message_type: MessageTypeEnum;
}
