import { InvocationContext } from "@azure/functions";
import { wrapHandlerV4 } from "@pagopa/io-functions-commons/dist/src/utils/azure-functions-v4-express-adapter";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import {
  IResponseErrorInternal,
  IResponseSuccessAccepted,
  ResponseErrorInternal,
  ResponseSuccessAccepted,
} from "@pagopa/ts-commons/lib/responses";
import { Ulid } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { ulid } from "ulid";

import { FiscalCodePayload } from "../generated/definitions/FiscalCodePayload";
import { RecoveryMessage } from "../types/queue-message";
import { trackError } from "../utils/errors";
import { QueueStorage } from "../utils/queue";

type ReturnTypes = IResponseErrorInternal | IResponseSuccessAccepted<undefined>;

type IStartCardsRecoveryHandler = (
  context: InvocationContext,
  fiscalCodePayload: FiscalCodePayload,
) => Promise<ReturnTypes>;

export const StartCardsRecoveryHandler =
  (queueStorage: QueueStorage): IStartCardsRecoveryHandler =>
  async (context: InvocationContext, fiscalCodePayload: FiscalCodePayload) =>
    pipe(
      {
        fiscal_code: fiscalCodePayload.fiscal_code,
        request_id: ulid() as Ulid,
      } as RecoveryMessage,
      TE.of,
      TE.chainFirstW((recoveryMessage) =>
        pipe(
          queueStorage.enqueueRecoveryMessage(recoveryMessage),
          TE.mapLeft(trackError(context, "CardsRecovery_1_Start")),
          TE.mapLeft((e) => ResponseErrorInternal(e.message)),
        ),
      ),
      TE.map(() =>
        ResponseSuccessAccepted<undefined>("Recovery request accepted"),
      ),
      TE.toUnion,
    )();

export const StartCardsRecovery = (queueStorage: QueueStorage) => {
  const handler = StartCardsRecoveryHandler(queueStorage);

  const middlewares = [
    ContextMiddleware(),
    RequiredBodyPayloadMiddleware(FiscalCodePayload),
  ] as const;

  return wrapHandlerV4(middlewares, handler);
};
