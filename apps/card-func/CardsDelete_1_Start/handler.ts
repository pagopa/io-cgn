import * as express from "express";

import { Context } from "@azure/functions";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorInternal,
  IResponseSuccessAccepted,
  IResponseSuccessRedirectToResource,
  ResponseErrorInternal,
  ResponseSuccessAccepted,
  ResponseSuccessRedirectToResource
} from "@pagopa/ts-commons/lib/responses";
import {
  FiscalCode,
  NonEmptyString,
  Ulid
} from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { identity, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { ulid } from "ulid";
import { StatusEnum as PendingDeleteStatusEnum } from "../generated/definitions/CardPendingDelete";
import { CommonCard } from "../generated/definitions/CommonCard";
import { UserCgnModel } from "../models/user_cgn";
import { UserEycaCardModel } from "../models/user_eyca_card";
import { QueueStorage } from "../utils/queue";
import { InstanceId } from "../generated/definitions/InstanceId";

type IStartCgnActivationHandler = (
  context: Context,
  fiscalCode: FiscalCode
) => Promise<
  | IResponseSuccessRedirectToResource<InstanceId, InstanceId>
  | IResponseErrorInternal
>;

/**
 * Retrieve the last version of common cards if present
 * @param userCgnModel
 * @param userEycaCardModel
 * @param fiscalCode
 * @returns
 */
const findLastCommonCards = (
  userCgnModel: UserCgnModel,
  userEycaCardModel: UserEycaCardModel,
  fiscalCode: FiscalCode
) =>
  pipe(
    TE.Do,
    TE.bind("maybeCgnCommonCard", () =>
      pipe(
        userCgnModel.findLastVersionByModelId([fiscalCode]),
        TE.mapLeft(
          cosmosErrors =>
            new Error(`${cosmosErrors.kind}|Cannot query cosmos CGN`)
        ),
        TE.chainW(
          O.foldW(
            () => TE.of(O.none),
            userCgn =>
              pipe(
                userCgn.card,
                CommonCard.decode,
                E.mapLeft(
                  _ => new Error("Cannot find user CGN card expiration")
                ),
                TE.fromEither,
                TE.map(O.some)
              )
          )
        )
      )
    ),
    TE.bind("maybeEycaCommonCard", () =>
      pipe(
        userEycaCardModel.findLastVersionByModelId([fiscalCode]),
        TE.mapLeft(
          cosmosErrors =>
            new Error(`${cosmosErrors.kind}|Cannot query cosmos EYCA`)
        ),
        TE.chainW(
          O.foldW(
            () => TE.of(O.none),
            userEyca =>
              pipe(
                userEyca.card,
                CommonCard.decode,
                E.mapLeft(
                  _ => new Error("Cannot find user EYCA card expiration")
                ),
                TE.fromEither,
                TE.map(O.some)
              )
          )
        )
      )
    )
  );

/**
 * Enqueue pending delete message for CGN
 * @param queueStorage
 * @param fiscalCode
 * @param maybeCgnCommonCard
 * @returns
 */
const enqueuePendingDeleteCgn = (
  requestId: Ulid,
  queueStorage: QueueStorage,
  fiscalCode: FiscalCode,
  maybeCgnCommonCard: O.Option<CommonCard>
): TE.TaskEither<Error, boolean> =>
  pipe(
    maybeCgnCommonCard,
    O.fold(
      () => TE.of(true),
      commonCard =>
        queueStorage.enqueuePendingDeleteCGNMessage({
          request_id: requestId,
          fiscal_code: fiscalCode,
          expiration_date: commonCard.expiration_date,
          status: PendingDeleteStatusEnum.PENDING_DELETE
        })
    ),
    TE.chain(
      TE.fromPredicate(identity, _ => new Error("Internal error queue service"))
    )
  );

/**
 * Enqueue pending delete message for EYCA
 * @param queueStorage
 * @param fiscalCode
 * @param maybeEycaCommonCard
 * @returns
 */
const enqueuePendingDeleteEyca = (
  requestId: Ulid,
  queueStorage: QueueStorage,
  fiscalCode: FiscalCode,
  maybeEycaCommonCard: O.Option<CommonCard>
): TE.TaskEither<Error, boolean> =>
  pipe(
    maybeEycaCommonCard,
    O.fold(
      () => TE.of(true),
      commonCard =>
        queueStorage.enqueuePendingDeleteEYCAMessage({
          request_id: requestId,
          fiscal_code: fiscalCode,
          expiration_date: commonCard.expiration_date,
          status: PendingDeleteStatusEnum.PENDING_DELETE
        })
    ),
    TE.chain(
      TE.fromPredicate(identity, _ => new Error("Internal error queue service"))
    )
  );

export const StartCardsDeleteHandler = (
         userCgnModel: UserCgnModel,
         userEycaCardModel: UserEycaCardModel,
         queueStorage: QueueStorage
       ): IStartCgnActivationHandler => async (
         context: Context,
         fiscalCode: FiscalCode
       ) =>
         pipe(
           findLastCommonCards(userCgnModel, userEycaCardModel, fiscalCode),
           TE.bind("requestId", _ => TE.of(ulid() as Ulid)),
           // we try to enqueue message for eyca first to ensure
           // that eyca is always deleted first
           TE.chainFirst(({ requestId, maybeEycaCommonCard }) =>
             enqueuePendingDeleteEyca(
               requestId,
               queueStorage,
               fiscalCode,
               maybeEycaCommonCard
             )
           ),
           // we then try to enqueue message for cgn so that if
           // it fails we allow user to resend the request and if
           // eyca was already deleted we procede to delete the cgn
           TE.chainFirst(({ requestId, maybeCgnCommonCard }) =>
             enqueuePendingDeleteCgn(
               requestId,
               queueStorage,
               fiscalCode,
               maybeCgnCommonCard
             )
           ),
           TE.chain(({ requestId }) =>
             TE.of(
               pipe(
                 {
                   id: requestId.valueOf() as NonEmptyString
                 },
                 instanceid =>
                   ResponseSuccessRedirectToResource(
                     instanceid,
                     `/api/v1/cgn/${fiscalCode}/delete`,
                     instanceid
                   )
               )
             )
           ),
           TE.mapLeft(e => ResponseErrorInternal(e.message)),
           TE.toUnion
         )();

export const StartCardsDelete = (
  userCgnModel: UserCgnModel,
  userEycaCardModel: UserEycaCardModel,
  queueStorage: QueueStorage
): express.RequestHandler => {
  const handler = StartCardsDeleteHandler(
    userCgnModel,
    userEycaCardModel,
    queueStorage
  );
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredParamMiddleware("fiscalcode", FiscalCode)
  );
  return wrapRequestHandler(middlewaresWrap(handler));
};
