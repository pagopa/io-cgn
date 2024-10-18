import { Context } from "@azure/functions";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import * as AR from "fp-ts/ReadonlyArray";
import { StatusEnum as PendingDeleteStatusEnum } from "../generated/definitions/CardPendingDelete";
import { EycaCardActivated } from "../generated/definitions/EycaCardActivated";
import { EycaCardPendingDelete } from "../generated/definitions/EycaCardPendingDelete";
import { UserEycaCard, UserEycaCardModel } from "../models/user_eyca_card";
import { CardPendingDeleteMessage } from "../types/queue-message";
import { throwError, trackError } from "../utils/errors";
import { DeleteEycaCard } from "../utils/eyca";
import { DeleteCardExpirationFunction } from "../utils/table_storage";

/**
 * Upsert a PENDIND_DELETE EYCA Card on cosmos
 * @returns UserEyca
 */
const upsertPendingDeleteEycaCard = (
  userEycaCardModel: UserEycaCardModel,
  userEycaCard: UserEycaCard,
  eycaCardActivated: EycaCardActivated,
  fiscalCode: FiscalCode
) =>
  pipe(
    userEycaCardModel.upsert({
      ...userEycaCard,
      card: {
        ...eycaCardActivated,
        status: PendingDeleteStatusEnum.PENDING_DELETE
      },
      fiscalCode,
      kind: "INewUserEycaCard"
    }),
    TE.mapLeft(
      cosmosErrors =>
        new Error(`${cosmosErrors.kind}|Cannot upsert cosmos EYCA`)
    )
  );

/**
 * Creates a pending delete EYCA CARD or gets the already existing for the user
 * @param userCgnModel
 * @param fiscalCode
 * @returns TaskEither<Error,UserEyca>
 */
const createOrGetPendingDeleteEycaCard = (
  userEycaCardModel: UserEycaCardModel,
  fiscalCode: FiscalCode
): TE.TaskEither<Error, O.Option<UserEycaCard>> =>
  pipe(
    userEycaCardModel.findLastVersionByModelId([fiscalCode]),
    TE.mapLeft(
      cosmosErrors => new Error(`${cosmosErrors.kind}|Cannot query cosmos EYCA`)
    ),
    TE.chainW(
      O.fold(
        () => TE.of(O.none),
        userEycaCard =>
          EycaCardPendingDelete.is(userEycaCard.card)
            ? TE.of(O.some(userEycaCard))
            : pipe(
                userEycaCard.card,
                EycaCardActivated.decode,
                TE.fromEither,
                TE.mapLeft(_ => new Error("Card is not activated")),
                TE.chainW(eycaCardActivated =>
                  upsertPendingDeleteEycaCard(
                    userEycaCardModel,
                    userEycaCard,
                    eycaCardActivated,
                    fiscalCode
                  )
                ),
                TE.map(O.some)
              )
      )
    )
  );

/**
 * Deletes all UserEycaCard on cosmos db
 * @param userEycaCardModel
 * @param fiscalCode
 * @returns
 */
const deleteAllEycaCards = (
  userEycaCardModel: UserEycaCardModel,
  fiscalCode: FiscalCode
) =>
  pipe(
    userEycaCardModel.findAllEycaCards(fiscalCode),
    TE.mapLeft(_ => new Error("Cannot retrieve all eyca cards")),
    TE.chainW(cards =>
      pipe(
        AR.sequence(TE.ApplicativePar)(
          cards.map(element =>
            userEycaCardModel.deleteVersion(element.fiscalCode, element.id)
          )
        ),
        TE.mapLeft(_ => new Error("Cannot delete eyca version"))
      )
    )
  );

export const handler = (
  userEycaCardModel: UserEycaCardModel,
  deleteEycaExpiration: DeleteCardExpirationFunction,
  deleteEycaCard: DeleteEycaCard
) => (
  context: Context,
  pendingDeleteEycaMessage: CardPendingDeleteMessage
): Promise<boolean> =>
  pipe(
    // create or get a pending card
    createOrGetPendingDeleteEycaCard(
      userEycaCardModel,
      pendingDeleteEycaMessage.fiscal_code
    ),
    TE.chain(
      O.fold(
        // if no pending delete eyca means it has already been deleted
        () => TE.of(true),
        // if we have a pending delete eyca we do the delete procedure
        userEycaCard =>
          pipe(
            userEycaCard.card,
            EycaCardPendingDelete.decode,
            TE.fromEither,
            TE.mapLeft(_ => new Error("Eyca card is not pending delete")),
            TE.chain(eycaCardPendingDelete =>
              // delete card from CCDB
              deleteEycaCard(eycaCardPendingDelete.card_number)
            ),
            TE.chain(_ =>
              // delete eyca expiration
              deleteEycaExpiration(
                pendingDeleteEycaMessage.fiscal_code,
                new Date(pendingDeleteEycaMessage.expiration_date)
              )
            ),
            TE.chain(_ =>
              // delete all cards from cosmos
              deleteAllEycaCards(
                userEycaCardModel,
                pendingDeleteEycaMessage.fiscal_code
              )
            ),
            TE.map(_ => true)
          )
      )
    ),
    TE.mapLeft(
      trackError(
        context,
        `[${pendingDeleteEycaMessage.request_id}] CardsDelete_3_ProcessPendingDeleteEycaQueue`
      )
    ),
    TE.mapLeft(throwError),
    TE.toUnion
  )();