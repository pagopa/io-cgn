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
  ResponseErrorInternal,
  ResponseSuccessAccepted
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode, Ulid } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { ulid } from "ulid";
import { StatusEnum as PendingDeleteStatusEnum } from "../generated/definitions/CardPendingDelete";
import { CommonCard } from "../generated/definitions/CommonCard";
import { UserCgnModel } from "../models/user_cgn";
import { UserEycaCardModel } from "../models/user_eyca_card";
import { QueueStorage } from "../utils/queue";

type IStartCgnActivationHandler = (
  context: Context,
  fiscalCode: FiscalCode
) => Promise<IResponseSuccessAccepted<string> | IResponseErrorInternal>;

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
          request_id: ulid() as Ulid,
          fiscal_code: fiscalCode,
          expiration_date: commonCard.expiration_date,
          status: PendingDeleteStatusEnum.PENDING_DELETE
        })
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
          request_id: ulid() as Ulid,
          fiscal_code: fiscalCode,
          expiration_date: commonCard.expiration_date,
          status: PendingDeleteStatusEnum.PENDING_DELETE
        })
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
    TE.chain(cards =>
      pipe(
        [
          enqueuePendingDeleteCgn(
            queueStorage,
            fiscalCode,
            cards.maybeCgnCommonCard
          ),
          enqueuePendingDeleteEyca(
            queueStorage,
            fiscalCode,
            cards.maybeEycaCommonCard
          )
        ],
        TE.sequenceSeqArray
      )
    ),
    TE.mapLeft(e => ResponseErrorInternal(e.message)),
    TE.map(_ =>
      ResponseSuccessAccepted(
        "Request accepted",
        "Your request to delete your CGN card has been accepted."
      )
    ),
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
