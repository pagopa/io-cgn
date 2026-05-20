import { InvocationContext } from "@azure/functions";
import { wrapHandlerV4 } from "@pagopa/io-functions-commons/dist/src/utils/azure-functions-v4-express-adapter";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import {
  IResponseErrorInternal,
  IResponseSuccessAccepted,
  ResponseErrorInternal,
  ResponseSuccessAccepted,
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode, Ulid } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { ulid } from "ulid";

import { ExpirationRemediationMessage } from "../types/queue-message";
import { trackError } from "../utils/errors";
import { QueueStorage } from "../utils/queue";

type ReturnTypes = IResponseErrorInternal | IResponseSuccessAccepted<void>;

type IStartCardsExpirationRemediationHandler = (
  context: InvocationContext,
  fiscalCode: FiscalCode,
) => Promise<ReturnTypes>;

export const StartCardsExpirationRemediationHandler =
  (
    queueStorage: QueueStorage,
  ): IStartCardsExpirationRemediationHandler =>
  async (context: InvocationContext, fiscalCode: FiscalCode) =>
    pipe(
      {
        fiscal_code: fiscalCode,
        request_id: ulid() as Ulid,
      } as ExpirationRemediationMessage,
      TE.of,
      TE.chainFirstW((expirationRemediationMessage) =>
        pipe(
          queueStorage.enqueueExpirationRemediationMessage(
            expirationRemediationMessage,
          ),
          TE.mapLeft(trackError(context, "CardsExpirationRemediation_1_Start")),
          TE.mapLeft((e) => ResponseErrorInternal(e.message)),
        ),
      ),
      TE.map(() =>
        ResponseSuccessAccepted<void>("Expiration remediation request accepted"),
      ),
      TE.toUnion,
    )();

export const StartCardsExpirationRemediation = (queueStorage: QueueStorage) => {
  const handler = StartCardsExpirationRemediationHandler(queueStorage);

  const middlewares = [
    ContextMiddleware(),
    RequiredParamMiddleware("fiscalcode", FiscalCode),
  ] as const;

  return wrapHandlerV4(middlewares, handler);
};