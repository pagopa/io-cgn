import { FiscalCode, NonEmptyString, Ulid } from "@pagopa/ts-commons/lib/strings";
import { StatusEnum as ActivatedStatusEnum } from "../generated/definitions/CardActivated";
import { StatusEnum as PendingStatusEnum } from "../generated/definitions/CardPending";

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
  card_id: NonEmptyString
};
