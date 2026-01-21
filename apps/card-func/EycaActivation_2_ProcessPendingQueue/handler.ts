import { Context } from "@azure/functions";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { StatusEnum as ActivatedStatusEnum } from "../generated/definitions/CardActivated";
import { StatusEnum as PendingStatusEnum } from "../generated/definitions/CardPending";
import { UserEycaCard, UserEycaCardModel } from "../models/user_eyca_card";
import { CardPendingMessage } from "../types/queue-message";
import { errorsToError } from "../utils/conversions";
import { throwError, trackError } from "../utils/errors";
import { PreIssueEycaCard } from "../utils/eyca";
import { QueueStorage } from "../utils/queue";
import { StoreCardExpirationFunction } from "../utils/table_storage";

/**
 * Upsert EYCA Card on cosmos
 * @returns UserEyca
 */
const upsertEycaCard = (
  userEycaCardModel: UserEycaCardModel,
  fiscalCode: FiscalCode,
) =>
  pipe(
    userEycaCardModel.upsert({
      card: { status: PendingStatusEnum.PENDING },
      fiscalCode,
      id: `${fiscalCode}-0000000000000000` as NonEmptyString, // this will be replaced by upsert internally
      kind: "INewUserEycaCard",
    }),
    TE.mapLeft(
      (cosmosErrors) =>
        new Error(`${cosmosErrors.kind}|Cannot upsert cosmos EYCA`),
    ),
    TE.chain(
      flow(UserEycaCard.decode, TE.fromEither, TE.mapLeft(errorsToError)),
    ),
  );

/**
 * Creates a new EYCA CARD or gets the already existing for the user
 * @param userCgnModel
 * @param fiscalCode
 * @returns TaskEither<Error,UserEyca>
 */
const createOrGetEycaCard = (
  userEycaCardModel: UserEycaCardModel,
  fiscalCode: FiscalCode,
): TE.TaskEither<Error, UserEycaCard> =>
  pipe(
    userEycaCardModel.findLastVersionByModelId([fiscalCode]),
    TE.mapLeft(
      (cosmosErrors) =>
        new Error(`${cosmosErrors.kind}|Cannot query cosmos EYCA`),
    ),
    TE.chainW(
      O.fold(
        () => upsertEycaCard(userEycaCardModel, fiscalCode),
        (userEyca) => TE.of(userEyca),
      ),
    ),
  );

export const handler =
  (
    userEycaCardModel: UserEycaCardModel,
    storeEycaExpiration: StoreCardExpirationFunction,
    preIssueEycaCard: PreIssueEycaCard,
    queueStorage: QueueStorage,
  ) =>
  (
    context: Context,
    pendingEycaMessage: CardPendingMessage,
  ): Promise<boolean> =>
    pipe(
      // create or get a pending card
      createOrGetEycaCard(userEycaCardModel, pendingEycaMessage.fiscal_code),
      TE.chain(() =>
        // store eyca expiration
        storeEycaExpiration(
          pendingEycaMessage.fiscal_code,
          new Date(pendingEycaMessage.activation_date),
          new Date(pendingEycaMessage.expiration_date),
        ),
      ),
      TE.chain(() =>
        // pre issue card from CCDB
        preIssueEycaCard(),
      ),
      TE.chain((userEycaId) =>
        // send activated message to queue
        queueStorage.enqueueActivatedEYCAMessage({
          activation_date: pendingEycaMessage.activation_date,
          card_id: userEycaId,
          expiration_date: pendingEycaMessage.expiration_date,
          fiscal_code: pendingEycaMessage.fiscal_code,
          request_id: pendingEycaMessage.request_id,
          status: ActivatedStatusEnum.ACTIVATED,
        }),
      ),
      TE.mapLeft(
        trackError(
          context,
          `[${pendingEycaMessage.request_id}] EycaActivation_2_ProcessPendingQueue`,
        ),
      ),
      TE.mapLeft(throwError),
      TE.toUnion,
    )();
