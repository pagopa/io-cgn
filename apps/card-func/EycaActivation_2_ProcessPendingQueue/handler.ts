import { Context } from "@azure/functions";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { EycaAPIClient } from "../clients/eyca";
import { StatusEnum as ActivatedStatusEnum } from "../generated/definitions/CardActivated";
import { StatusEnum as PendingStatusEnum } from "../generated/definitions/CardPending";
import { UserEycaCard, UserEycaCardModel } from "../models/user_eyca_card";
import { CardPendingMessage } from "../types/queue-message";
import { fromBase64, toBase64 } from "../utils/base64";
import { throwError, trackError } from "../utils/errors";
import { preIssueCard, PreIssueEycaCard } from "../utils/eyca";
import { QueueStorage } from "../utils/queue";
import { RedisClientFactory } from "../utils/redis";
import { StoreCardExpirationFunction } from "../utils/table_storage";

/**
 * Upsert EYCA Card on cosmos
 * @returns UserEyca
 */
const upsertEycaCard = (
  userEycaCardModel: UserEycaCardModel,
  fiscalCode: FiscalCode
) =>
  pipe(
    userEycaCardModel.upsert({
      card: { status: PendingStatusEnum.PENDING },
      fiscalCode,
      kind: "INewUserEycaCard"
    }),
    TE.mapLeft(
      cosmosErrors =>
        new Error(`${cosmosErrors.kind}|Cannot upsert cosmos EYCA`)
    )
  );

/**
 * Creates a new EYCA CARD or gets the already existing for the user
 * @param userCgnModel
 * @param fiscalCode
 * @returns TaskEither<Error,UserEyca>
 */
const createOrGetEycaCard = (
  userEycaCardModel: UserEycaCardModel,
  fiscalCode: FiscalCode
): TE.TaskEither<Error, UserEycaCard> =>
  pipe(
    userEycaCardModel.findLastVersionByModelId([fiscalCode]),
    TE.mapLeft(
      cosmosErrors => new Error(`${cosmosErrors.kind}|Cannot query cosmos EYCA`)
    ),
    TE.chainW(
      O.fold(
        () => upsertEycaCard(userEycaCardModel, fiscalCode),
        userEyca => TE.of(userEyca)
      )
    )
  );

export const handler = (
  userEycaCardModel: UserEycaCardModel,
  storeEycaExpiration: StoreCardExpirationFunction,
  preIssueEycaCard: PreIssueEycaCard,
  queueStorage: QueueStorage
) => (context: Context, queueMessage: string): Promise<boolean> =>
  pipe(
    TE.of(fromBase64<CardPendingMessage>(queueMessage)),
    TE.chain(pendingEycaMessage =>
      pipe(
        // create or get a pending card
        createOrGetEycaCard(userEycaCardModel, pendingEycaMessage.fiscal_code),
        TE.chain(_ =>
          // store eyca expiration
          storeEycaExpiration(
            pendingEycaMessage.fiscal_code,
            pendingEycaMessage.activation_date,
            pendingEycaMessage.expiration_date
          )
        ),
        TE.chain(_ =>
          // pre issue card from CCDB
          preIssueEycaCard()
        ),
        TE.chain(userEycaId =>
          // send activated message to queue
          queueStorage.enqueueActivatedEYCAMessage(
            toBase64({
              request_id: pendingEycaMessage.request_id,
              fiscal_code: pendingEycaMessage.fiscal_code,
              activation_date: pendingEycaMessage.activation_date,
              expiration_date: pendingEycaMessage.expiration_date,
              status: ActivatedStatusEnum.ACTIVATED,
              card_id: userEycaId
            })
          )
        ),
        TE.mapLeft(
          trackError(
            context,
            `[${pendingEycaMessage.request_id}] EycaActivation_2_ProcessPendingQueue`
          )
        )
      )
    ),
    TE.mapLeft(throwError),
    TE.toUnion
  )();
