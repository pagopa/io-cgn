import { InvocationContext } from "@azure/functions";
import { wrapHandlerV4 } from "@pagopa/io-functions-commons/dist/src/utils/azure-functions-v4-express-adapter";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import {
  IResponseErrorConflict,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseSuccessRedirectToResource,
  ResponseErrorConflict,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseSuccessRedirectToResource,
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { ulid } from "ulid";

import { StatusEnum as PendingStatusEnum } from "../generated/definitions/CardPending";
import { InstanceId } from "../generated/definitions/InstanceId";
import { UserEycaCardModel } from "../models/user_eyca_card";
import { CardPendingMessage } from "../types/queue-message";
import {
  extractEycaExpirationDate,
  isCardActivated,
  isEycaEligible,
} from "../utils/cgn_checks";
import { trackError } from "../utils/errors";
import { QueueStorage } from "../utils/queue";

type IStartEycaActivationHandler = (
  context: InvocationContext,
  fiscalCode: FiscalCode,
) => Promise<
  | IResponseErrorConflict
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorInternal
  | IResponseSuccessRedirectToResource<InstanceId, InstanceId>
>;

/**
 *
 * @param userEycaCardModel
 * @param fiscalCode
 * @returns
 */
const shouldActivateNewEyca = (
  context: InvocationContext,
  userEycaCardModel: UserEycaCardModel,
  fiscalCode: FiscalCode,
): TE.TaskEither<IResponseErrorConflict | IResponseErrorInternal, boolean> =>
  pipe(
    userEycaCardModel.findLastVersionByModelId([fiscalCode]),
    TE.mapLeft((cosmosErrors) => new Error(cosmosErrors.kind)),
    TE.mapLeft(trackError(context, "EycaActivation_1_Start")),
    TE.mapLeft(() => ResponseErrorInternal("Cannot query for existing EYCA")),
    TE.chainW(
      O.fold(
        () => TE.of(true),
        (userEycaCard) =>
          isCardActivated(userEycaCard)
            ? pipe(
                TE.left(new Error("EYCA already activated")),
                TE.mapLeft(trackError(context, "EycaActivation_1_Start")),
                TE.mapLeft((e) => ResponseErrorConflict(e.message)),
              )
            : // we always try to "re-activate", next flow will be idempotent
              TE.of(true),
      ),
    ),
  );

/**
 * Get eyca expiration date if eligible
 * @param fiscalCode
 * @param eycaUpperBoundAge
 * @returns
 */
const getEycaExpirationDateIfEligibleTask = (
  fiscalCode: FiscalCode,
  eycaUpperBoundAge: NonNegativeInteger,
) =>
  pipe(
    E.Do,
    E.bind("expirationDate", () =>
      extractEycaExpirationDate(fiscalCode, eycaUpperBoundAge),
    ),
    E.bind("isEligibile", () => isEycaEligible(fiscalCode, eycaUpperBoundAge)),
    TE.fromEither,
    TE.mapLeft((e) => ResponseErrorInternal(e.message)),
    TE.chainW((eycaEligibilityInfo) =>
      eycaEligibilityInfo.isEligibile
        ? TE.right(eycaEligibilityInfo.expirationDate)
        : TE.left(ResponseErrorForbiddenNotAuthorized),
    ),
  );

export const StartEycaActivationHandler =
  (
    userEycaCardModel: UserEycaCardModel,
    eycaUpperBoundAge: NonNegativeInteger,
    queueStorage: QueueStorage,
  ): IStartEycaActivationHandler =>
  async (context: InvocationContext, fiscalCode: FiscalCode) =>
    pipe(
      shouldActivateNewEyca(context, userEycaCardModel, fiscalCode),
      TE.chainW(() =>
        getEycaExpirationDateIfEligibleTask(fiscalCode, eycaUpperBoundAge),
      ),
      TE.map(
        (expirationDate) =>
          ({
            activation_date: new Date(),
            expiration_date: expirationDate,
            fiscal_code: fiscalCode,
            request_id: ulid(),
            status: PendingStatusEnum.PENDING,
          }) as CardPendingMessage,
      ),
      TE.chainFirstW((pendingCardMessage) =>
        pipe(
          queueStorage.enqueuePendingEYCAMessage(pendingCardMessage),
          TE.mapLeft(trackError(context, "EycaActivation_1_Start")),
          TE.mapLeft((e) => ResponseErrorInternal(e.message)),
        ),
      ),
      TE.map((pendingEycaMessage) =>
        pipe(
          {
            id: pendingEycaMessage.request_id.valueOf() as NonEmptyString,
          },
          (instanceid) =>
            ResponseSuccessRedirectToResource(
              instanceid,
              `/api/v1/cgn/${fiscalCode}/eyca/activation`,
              instanceid,
            ),
        ),
      ),
      TE.toUnion,
    )();

export const StartEycaActivation = (
  userEycaCardModel: UserEycaCardModel,
  eycaUpperBoundAge: NonNegativeInteger,
  queueStorage: QueueStorage,
) => {
  const handler = StartEycaActivationHandler(
    userEycaCardModel,
    eycaUpperBoundAge,
    queueStorage,
  );
  const middlewares = [
    ContextMiddleware(),
    RequiredParamMiddleware("fiscalcode", FiscalCode),
  ] as const;
  return wrapHandlerV4(middlewares, handler);
};
