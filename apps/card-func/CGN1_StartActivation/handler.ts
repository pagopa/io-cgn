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
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { ulid } from "ulid";
import { StatusEnum as ActivatedStatusEnum } from "../generated/definitions/CardActivated";
import { StatusEnum as ExpiredStatusEnum } from "../generated/definitions/CardExpired";
import { StatusEnum as PendingStatusEnum } from "../generated/definitions/CardPending";
import { StatusEnum as PendingDeleteStatusEnum } from "../generated/definitions/CardPendingDelete";
import { StatusEnum as RevokedStatusEnum } from "../generated/definitions/CardRevoked";
import { UserCgnModel } from "../models/user_cgn";
import {
  checkCgnRequirements,
  extractCgnExpirationDate
} from "../utils/cgn_checks";
import { QueueStorage } from "../utils/queue";
import { trackError } from "../utils/errors";

type PendingCGNMessage = {
  request_id: Ulid;
  activation_date: Date;
  expiration_date: Date;
  status: PendingStatusEnum.PENDING;
};

type IStartCgnActivationHandler = (
  context: Context,
  fiscalCode: FiscalCode
) => Promise<
  | IResponseSuccessRedirectToResource<Ulid, string>
  | IResponseErrorInternal
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorConflict
>;

/**
 * Check if a citizen is eligible for CGN activation
 * A citizen is eligible for a CGN while he's from 18 to 35 years old
 * If eligible returns the calculated expiration date for the CGN
 *
 * @param fiscalCode: the citizen's fiscalCode
 */
const getCgnExpirationDataTask = (
  context: Context,
  fiscalCode: FiscalCode,
  cgnUpperBoundAge: NonNegativeInteger
): TE.TaskEither<
  IResponseErrorInternal | IResponseErrorForbiddenNotAuthorized,
  Date
> =>
  pipe(
    checkCgnRequirements(fiscalCode, cgnUpperBoundAge),
    TE.mapLeft(trackError(context, "CGN1_StartActivation")),
    TE.mapLeft(() =>
      ResponseErrorInternal("Cannot perform CGN Eligibility Check")
    ),
    TE.chainW(
      TE.fromPredicate(
        isEligible => isEligible === true,
        () => ResponseErrorForbiddenNotAuthorized
      )
    ),
    TE.chainW(() =>
      pipe(
        extractCgnExpirationDate(fiscalCode, cgnUpperBoundAge),
        TE.mapLeft(trackError(context, "CGN1_StartActivation")),
        TE.mapLeft(() =>
          ResponseErrorInternal("Cannot perform CGN Eligibility Check")
        )
      )
    )
  );

/**
 *
 * @param userCgnModel
 * @param fiscalCode
 * @returns
 */
const shouldActivateNewCGN = (
  context: Context,
  userCgnModel: UserCgnModel,
  fiscalCode: FiscalCode
): TE.TaskEither<IResponseErrorInternal | IResponseErrorConflict, boolean> =>
  pipe(
    userCgnModel.findLastVersionByModelId([fiscalCode]),
    TE.mapLeft(cosmosErrors => new Error(cosmosErrors.kind)),
    TE.mapLeft(trackError(context, "CGN1_StartActivation")),
    TE.mapLeft(_ => ResponseErrorInternal("Cannot query for existing CGN")),
    TE.chainW(
      O.fold(
        () => TE.of(true),
        userCgn =>
          [
            ActivatedStatusEnum.ACTIVATED.toString(),
            ExpiredStatusEnum.EXPIRED.toString(),
            RevokedStatusEnum.REVOKED.toString(),
            PendingDeleteStatusEnum.PENDING_DELETE.toString()
          ].includes(userCgn.card.status)
            ? pipe(
                TE.left(new Error("CGN already activated")),
                TE.mapLeft(trackError(context, "CGN1_StartActivation")),
                TE.mapLeft(e => ResponseErrorConflict(e.message))
              )
            : // we always try to "re-activate", next flow will be idempotent
              TE.of(true)
      )
    )
  );

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export const StartCgnActivationHandler = (
  userCgnModel: UserCgnModel,
  cgnUpperBoundAge: NonNegativeInteger,
  queueStorage: QueueStorage
): IStartCgnActivationHandler => async (
  context: Context,
  fiscalCode: FiscalCode
) =>
  pipe(
    shouldActivateNewCGN(context, userCgnModel, fiscalCode),
    TE.chainW(_ =>
      getCgnExpirationDataTask(context, fiscalCode, cgnUpperBoundAge)
    ),
    TE.map(
      expirationDate =>
        ({
          request_id: ulid(),
          activation_date: new Date(),
          expiration_date: expirationDate,
          status: PendingStatusEnum.PENDING
        } as PendingCGNMessage)
    ),
    TE.chainFirstW(pendingCardMessage =>
      pipe(
        queueStorage.enqueuePendingCGNMessage(context, JSON.stringify(pendingCardMessage)),
        TE.mapLeft(e => ResponseErrorInternal(e.message))
      )
    ),
    TE.map(pendingCgnMessage =>
      ResponseSuccessRedirectToResource(
        pendingCgnMessage.request_id,
        `/api/v1/cgn/${fiscalCode}/activation`,
        pendingCgnMessage.request_id
      )
    ),
    TE.mapLeft(x => x),
    TE.toUnion
  )();

export const StartCgnActivation = (
  userCgnModel: UserCgnModel,
  cgnUpperBoundAge: NonNegativeInteger,
  queueStorage: QueueStorage
): express.RequestHandler => {
  const handler = StartCgnActivationHandler(
    userCgnModel,
    cgnUpperBoundAge,
    queueStorage
  );
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredParamMiddleware("fiscalcode", FiscalCode)
  );
  return wrapRequestHandler(middlewaresWrap(handler));
};
