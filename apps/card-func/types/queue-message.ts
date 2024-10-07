import { FiscalCode, Ulid } from "@pagopa/ts-commons/lib/strings";
import { StatusEnum as ActivatedStatusEnum } from "../generated/definitions/CardActivated";
import { StatusEnum as PendingStatusEnum } from "../generated/definitions/CardPending";

export type PendingCGNMessage = {
  request_id: Ulid;
  fiscal_code: FiscalCode;
  activation_date: Date;
  expiration_date: Date;
  status: PendingStatusEnum.PENDING;
};

export type ActivatedCGNMessage = {
  request_id: Ulid;
  fiscal_code: FiscalCode;
  status: ActivatedStatusEnum.ACTIVATED;
};
