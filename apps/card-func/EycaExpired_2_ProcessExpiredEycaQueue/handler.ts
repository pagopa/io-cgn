import { Context } from "@azure/functions";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/Either";
import {
  StatusEnum as ActivatedStatusEnum,
  CardActivated
} from "../generated/definitions/CardActivated";
import { StatusEnum as PendingStatusEnum } from "../generated/definitions/CardPending";
import { UserEycaCard, UserEycaCardModel } from "../models/user_eyca_card";
import {
  CardExpiredMessage,
  CardPendingMessage,
  MessageToSendMessage
} from "../types/queue-message";
import { fromBase64, toBase64 } from "../utils/base64";
import { throwError, trackError } from "../utils/errors";
import { PreIssueEycaCard } from "../utils/eyca";
import { QueueStorage } from "../utils/queue";
import { StoreCardExpirationFunction } from "../utils/table_storage";
import { EycaCard } from "../generated/definitions/EycaCard";
import {
  CardExpired,
  StatusEnum as ExpiredStatusEnum
} from "../generated/definitions/CardExpired";
import { EycaCardActivated } from "../generated/definitions/EycaCardActivated";
import { MessageTypeEnum } from "../utils/messages";

/**
 * Upsert expired EYCA Card on cosmos
 * @returns UserEyca
 */
const upsertEycaCard = (
  userEycaCardModel: UserEycaCardModel,
  userEyca: UserEycaCard,
  card: EycaCardActivated
) =>
  pipe(
    userEycaCardModel.upsert({
      ...userEyca,
      card: { ...card, status: ExpiredStatusEnum.EXPIRED },
      kind: "INewUserEycaCard"
    }),
    TE.mapLeft(
      cosmosErrors =>
        new Error(`${cosmosErrors.kind}|Cannot upsert cosmos EYCA`)
    )
  );

/**
 * Expires EYCA CARD if not expired
 * @param userCgnModel
 * @param fiscalCode
 * @returns TaskEither<Error,UserEyca>
 */
const expireCardIfNotExpired = (
  userEycaCardModel: UserEycaCardModel,
  expiredEycaMessage: CardExpiredMessage
): TE.TaskEither<Error, O.Option<EycaCard>> =>
  pipe(
    userEycaCardModel.findLastVersionByModelId([
      expiredEycaMessage.fiscal_code
    ]),
    TE.mapLeft(
      cosmosErrors => new Error(`${cosmosErrors.kind}|Cannot query cosmos EYCA`)
    ),
    TE.chainW(
      O.fold(
        () => TE.of(O.none),
        userEyca =>
          pipe(
            userEyca.card,
            CardExpired.decode,
            E.fold(
              // if not expired just upsert a new expired card if eyca is activated
              _ =>
                pipe(
                  userEyca.card,
                  EycaCardActivated.decode,
                  E.foldW(
                    // if eyca is not activated return none
                    _ => TE.of(O.none),
                    // if eyca is activate upsert and return card
                    eycaActivated =>
                      pipe(
                        upsertEycaCard(
                          userEycaCardModel,
                          userEyca,
                          eycaActivated
                        ),
                        TE.map(userEyca => O.some(userEyca.card))
                      )
                  )
                ),
              // if already expired do not return anything
              _ => TE.of(O.none)
            )
          )
      )
    )
  );

export const handler = (
  userEycaCardModel: UserEycaCardModel,
  queueStorage: QueueStorage
) => (
  context: Context,
  expiredEycaMessage: CardExpiredMessage
): Promise<boolean> =>
  pipe(
    // create or get a pending card
    expireCardIfNotExpired(userEycaCardModel, expiredEycaMessage),
    TE.chain(
      O.fold(
        () => TE.of(true),
        // send expired message to queue
        eycaCard =>
          queueStorage.enqueueMessageToSendMessage({
            fiscal_code: expiredEycaMessage.fiscal_code,
            message_type: MessageTypeEnum.EYCA_CARD_EXPIRED,
            card: eycaCard
          })
      )
    ),
    TE.mapLeft(
      trackError(
        context,
        `[${expiredEycaMessage.request_id}] EycaExpired_2_ProcessExpiredEycaQueue`
      )
    ),
    TE.mapLeft(throwError),
    TE.toUnion
  )();
