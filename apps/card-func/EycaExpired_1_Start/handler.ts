﻿import { Context } from "@azure/functions";
import * as date_fns from "date-fns";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { ulid } from "ulid";

import { StatusEnum as ExpiredStatusEnum } from "../generated/definitions/CardExpired";
import { CardExpiredMessage } from "../types/queue-message";
import { GetExpiredCardUserFunction } from "../utils/card_expiration";
import { throwError, trackError } from "../utils/errors";
import { QueueStorage } from "../utils/queue";

export const getUpdateExpiredEycaHandler =
  (
    getExpiredCardUsers: GetExpiredCardUserFunction,
    queueStorage: QueueStorage,
  ) =>
  async (context: Context): Promise<boolean> =>
    pipe(
      date_fns.format(Date.now(), "yyyy-MM-dd"),
      getExpiredCardUsers,
      TE.map(
        RA.map(({ activationDate, expirationDate, fiscalCode }) =>
          queueStorage.enqueueExpiredEYCAMessage({
            activation_date: activationDate,
            expiration_date: expirationDate,
            fiscal_code: fiscalCode,
            request_id: ulid(),
            status: ExpiredStatusEnum.EXPIRED,
          } as CardExpiredMessage),
        ),
      ),
      TE.chain(RA.sequence(TE.ApplicativeSeq)),
      TE.map(() => true),
      TE.mapLeft(trackError(context, `EycaExpired_1_Start`)),
      TE.mapLeft(throwError),
      TE.toUnion,
    )();
