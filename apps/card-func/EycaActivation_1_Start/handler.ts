import * as express from "express";

import { Context } from "@azure/functions";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import {
  IResponseErrorConflict,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseSuccessRedirectToResource,
  ResponseErrorConflict,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseSuccessRedirectToResource
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode, Ulid } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { ulid } from "ulid";
import { StatusEnum as PendingStatusEnum } from "../generated/definitions/CardPending";
import { UserEycaCardModel } from "../models/user_eyca_card";
import { CardPendingMessage } from "../types/queue-message";
import { toBase64 } from "../utils/base64";
import {
  extractEycaExpirationDate,
  isCardActivated,
  isEycaEligible
} from "../utils/cgn_checks";
import { trackError } from "../utils/errors";
import { QueueStorage } from "../utils/queue";

type IStartEycaActivationHandler = (
  context: Context,
  fiscalCode: FiscalCode
) => Promise<
  | IResponseSuccessRedirectToResource<Ulid, string>
  | IResponseErrorInternal
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorConflict
>;

/**
 *
 * @param userEycaCardModel
 * @param fiscalCode
 * @returns
 */
const shouldActivateNewEyca = (
  context: Context,
  userEycaCardModel: UserEycaCardModel,
  fiscalCode: FiscalCode
): TE.TaskEither<IResponseErrorInternal | IResponseErrorConflict, boolean> =>
  pipe(
    userEycaCardModel.findLastVersionByModelId([fiscalCode]),
    TE.mapLeft(cosmosErrors => new Error(cosmosErrors.kind)),
    TE.mapLeft(trackError(context, "EycaActivation_1_Start")),
    TE.mapLeft(_ => ResponseErrorInternal("Cannot query for existing EYCA")),
    TE.chainW(
      O.fold(
        () => TE.of(true),
        userEycaCard =>
          isCardActivated(userEycaCard)
            ? pipe(
                TE.left(new Error("EYCA already activated")),
                TE.mapLeft(trackError(context, "EycaActivation_1_Start")),
                TE.mapLeft(e => ResponseErrorConflict(e.message))
              )
            : // we always try to "re-activate", next flow will be idempotent
              TE.of(true)
      )
    )
  );

/**
 * Get eyca expiration date if eligible
 * @param fiscalCode
 * @param eycaUpperBoundAge
 * @returns
 */
const getEycaExpirationDateIfEligibleTask = (
  fiscalCode: FiscalCode,
  eycaUpperBoundAge: NonNegativeInteger
) =>
  pipe(
    E.Do,
    E.bind("expirationDate", () =>
      extractEycaExpirationDate(fiscalCode, eycaUpperBoundAge)
    ),
    E.bind("isEligibile", () => isEycaEligible(fiscalCode, eycaUpperBoundAge)),
    TE.fromEither,
    TE.mapLeft(e => ResponseErrorInternal(e.message)),
    TE.chainW(eycaEligibilityInfo =>
      eycaEligibilityInfo.isEligibile
        ? TE.right(eycaEligibilityInfo.expirationDate)
        : TE.left(ResponseErrorForbiddenNotAuthorized)
    )
  );

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export const StartEycaActivationHandler = (
  userEycaCardModel: UserEycaCardModel,
  eycaUpperBoundAge: NonNegativeInteger,
  queueStorage: QueueStorage
): IStartEycaActivationHandler => async (
  context: Context,
  fiscalCode: FiscalCode
) =>
  pipe(
    shouldActivateNewEyca(context, userEycaCardModel, fiscalCode),
    TE.chainW(_ =>
      getEycaExpirationDateIfEligibleTask(fiscalCode, eycaUpperBoundAge)
    ),
    TE.map(
      expirationDate =>
        ({
          request_id: ulid(),
          fiscal_code: fiscalCode,
          activation_date: new Date(),
          expiration_date: expirationDate,
          status: PendingStatusEnum.PENDING
        } as CardPendingMessage)
    ),
    TE.chainFirstW(pendingCardMessage =>
      pipe(
        queueStorage.enqueuePendingEYCAMessage(toBase64(pendingCardMessage)),
        TE.mapLeft(trackError(context, "EycaActivation_1_Start")),
        TE.mapLeft(e => ResponseErrorInternal(e.message))
      )
    ),
    TE.map(pendingEycaMessage =>
      ResponseSuccessRedirectToResource(
        pendingEycaMessage.request_id,
        `/api/v1/cgn/${fiscalCode}/eyca/activation`,
        pendingEycaMessage.request_id
      )
    ),
    TE.toUnion
  )();

export const StartEycaActivation = (
  userEycaCardModel: UserEycaCardModel,
  eycaUpperBoundAge: NonNegativeInteger,
  queueStorage: QueueStorage
): express.RequestHandler => {
  const handler = StartEycaActivationHandler(
    userEycaCardModel,
    eycaUpperBoundAge,
    queueStorage
  );
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredParamMiddleware("fiscalcode", FiscalCode)
  );
  return wrapRequestHandler(middlewaresWrap(handler));
};
