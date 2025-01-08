import { Context } from "@azure/functions";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { Card } from "../generated/definitions/Card";
import { StatusEnum as ExpiredStatusEnum } from "../generated/definitions/CardExpired";
import { CardExpired } from "../generated/definitions/CardExpired";
import { UserCgn, UserCgnModel } from "../models/user_cgn";
import { CardExpiredMessage } from "../types/queue-message";
import { throwError, trackError } from "../utils/errors";
import { MessageTypeEnum } from "../utils/messages";
import { QueueStorage } from "../utils/queue";

/**
 * Upsert expirated CGN Card on cosmos
 * @returns UserCgn
 */
const upsertCgnCard = (
  userCgnModel: UserCgnModel,
  userCgn: UserCgn,
  expiredCgnMessage: CardExpiredMessage,
) =>
  pipe(
    userCgnModel.upsert({
      ...userCgn,
      card: {
        activation_date: new Date(expiredCgnMessage.activation_date),
        expiration_date: new Date(expiredCgnMessage.expiration_date),
        status: ExpiredStatusEnum.EXPIRED,
      },
      kind: "INewUserCgn",
    }),
    TE.mapLeft(
      (cosmosErrors) =>
        new Error(`${cosmosErrors.kind}|Cannot upsert cosmos CGN`),
    ),
  );

/**
 * Expires a CGN CARD if not expired
 * @param userCgnModel
 * @param fiscalCode
 * @returns TaskEither<Error,UserCgn>
 */
const expireCardIfNotExpired = (
  userCgnModel: UserCgnModel,
  expiredCgnMessage: CardExpiredMessage,
): TE.TaskEither<Error, O.Option<Card>> =>
  pipe(
    userCgnModel.findLastVersionByModelId([expiredCgnMessage.fiscal_code]),
    TE.mapLeft(
      (cosmosErrors) =>
        new Error(`${cosmosErrors.kind}|Cannot query cosmos CGN`),
    ),
    TE.chainW(
      O.fold(
        () => TE.of(O.none),
        (userCgn) =>
          pipe(
            userCgn.card,
            CardExpired.decode,
            E.fold(
              // if not expired just upsert a new expired card
              () =>
                pipe(
                  upsertCgnCard(userCgnModel, userCgn, expiredCgnMessage),
                  TE.map((userCgn) => O.some(userCgn.card)),
                ),
              // if already expired do not return anything
              () => TE.of(O.none),
            ),
          ),
      ),
    ),
  );

export const handler =
  (userCgnModel: UserCgnModel, queueStorage: QueueStorage) =>
  (context: Context, expiredCgnMessage: CardExpiredMessage): Promise<boolean> =>
    pipe(
      expireCardIfNotExpired(userCgnModel, expiredCgnMessage),
      TE.chain(
        O.fold(
          // no card means already expired or deleted
          () => TE.of(true),
          (card) =>
            queueStorage.enqueueMessageToSendMessage({
              card: card,
              fiscal_code: expiredCgnMessage.fiscal_code,
              message_type: MessageTypeEnum.CARD_EXPIRED,
            }),
        ),
      ),
      TE.mapLeft(
        trackError(
          context,
          `[${expiredCgnMessage.request_id}] CgnExpired_2_ProcessExpiredCgnQueue`,
        ),
      ),
      TE.mapLeft(throwError),
      TE.toUnion,
    )();
