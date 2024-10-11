import { Context } from "@azure/functions";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { StatusEnum as ActivatedStatusEnum } from "../generated/definitions/CardActivated";
import { CcdbNumber } from "../generated/definitions/CcdbNumber";
import {
  RetrievedUserEycaCard,
  UserEycaCardModel
} from "../models/user_eyca_card";
import { CardActivatedMessage } from "../types/queue-message";
import { fromBase64 } from "../utils/base64";
import { throwError, trackError } from "../utils/errors";
import { UpdateCcdbEycaCard } from "../utils/eyca";

/**
 * Update EYCA Card on cosmos
 * @returns UserEyca
 */
const updateUserEycaCard = (
  userEycaCardModel: UserEycaCardModel,
  userEycaCard: RetrievedUserEycaCard
) =>
  pipe(
    userEycaCardModel.update(userEycaCard),
    TE.mapLeft(
      cosmosErrors =>
        new Error(`${cosmosErrors.kind}|Cannot update cosmos EYCA`)
    )
  );

/**
 * Get EYCA CARD for the user
 * @param userCgnModel
 * @param fiscalCode
 * @returns TaskEither<Error,UserEyca>
 */
const getUserEycaCard = (
  userEycaCardModel: UserEycaCardModel,
  fiscalCode: FiscalCode
): TE.TaskEither<Error, RetrievedUserEycaCard> =>
  pipe(
    userEycaCardModel.findLastVersionByModelId([fiscalCode]),
    TE.mapLeft(
      cosmosErrors => new Error(`${cosmosErrors.kind}|Cannot query cosmos CGN`)
    ),
    TE.chainW(
      O.fold(
        () => TE.left(new Error("Cannot find EYCA card")),
        userEyca => TE.of(userEyca)
      )
    )
  );

export const handler = (
  userEycaCardModel: UserEycaCardModel,
  updateCcdbEycaCard: UpdateCcdbEycaCard
) => (
  context: Context,
  activatedEycaMessage: CardActivatedMessage
): Promise<boolean> =>
  pipe(
    TE.Do,
    TE.bind("eycaNumber", () =>
      // decode eycaNumber as CcdbNumber
      pipe(
        CcdbNumber.decode(activatedEycaMessage.card_id),
        TE.fromEither,
        TE.mapLeft(E.toError)
      )
    ),
    TE.bind("userEyca", () =>
      // create or get a pending card
      getUserEycaCard(userEycaCardModel, activatedEycaMessage.fiscal_code)
    ),
    TE.chainFirst(eycaInfo =>
      // update card to CCDB
      updateCcdbEycaCard(
        eycaInfo.eycaNumber,
        activatedEycaMessage.expiration_date
      )
    ),
    TE.chain(eycaInfo =>
      // update card on cosmos
      updateUserEycaCard(userEycaCardModel, {
        ...eycaInfo.userEyca,
        card: {
          card_number: eycaInfo.eycaNumber,
          activation_date: activatedEycaMessage.activation_date,
          expiration_date: activatedEycaMessage.expiration_date,
          status: ActivatedStatusEnum.ACTIVATED
        }
      })
    ),
    TE.map(_ => true), // do not care about result
    TE.mapLeft(
      trackError(
        context,
        `[${activatedEycaMessage.request_id}] EycaActivation_2_ProcessPendingQueue`
      )
    ),
    TE.mapLeft(throwError),
    TE.toUnion
  )();
