import { InvocationContext } from "@azure/functions";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { CardActivated } from "../generated/definitions/CardActivated";
import {
  CardExpired,
  StatusEnum as ExpiredStatusEnum,
} from "../generated/definitions/CardExpired";
import { EycaCardActivated } from "../generated/definitions/EycaCardActivated";
import { UserCgn, UserCgnModel } from "../models/user_cgn";
import { UserEycaCard, UserEycaCardModel } from "../models/user_eyca_card";
import { RecoveryMessage } from "../types/queue-message";
import {
  checkCgnRequirements,
  extractCgnExpirationDate,
  extractEycaExpirationDate,
  isEycaEligible,
} from "../utils/cgn_checks";
import { throwError, trackError } from "../utils/errors";

const upsertExpiredCgnCard = (
  userCgnModel: UserCgnModel,
  userCgn: UserCgn,
  activatedCgnCard: CardActivated,
  expirationDate: Date,
) =>
  pipe(
    userCgnModel.upsert({
      ...userCgn,
      card: {
        activation_date: new Date(activatedCgnCard.activation_date),
        expiration_date: expirationDate,
        status: ExpiredStatusEnum.EXPIRED,
      },
      kind: "INewUserCgn",
    }),
    TE.mapLeft(
      (cosmosErrors) =>
        new Error(`${cosmosErrors.kind}|Cannot upsert cosmos CGN`),
    ),
  );

const upsertExpiredEycaCard = (
  userEycaCardModel: UserEycaCardModel,
  userEycaCard: UserEycaCard,
  activatedEycaCard: EycaCardActivated,
  expirationDate: Date,
) =>
  pipe(
    userEycaCardModel.upsert({
      ...userEycaCard,
      card: {
        ...activatedEycaCard,
        expiration_date: expirationDate,
        status: ExpiredStatusEnum.EXPIRED,
      },
      kind: "INewUserEycaCard",
    }),
    TE.mapLeft(
      (cosmosErrors) =>
        new Error(`${cosmosErrors.kind}|Cannot upsert cosmos EYCA`),
    ),
  );

const expireCgnCardIfActivated = (
  userCgnModel: UserCgnModel,
  userCgn: UserCgn,
  expirationDate: Date,
) =>
  pipe(
    userCgn.card,
    CardExpired.decode,
    E.fold(
      () =>
        pipe(
          userCgn.card,
          CardActivated.decode,
          E.fold(
            () => TE.of(false),
            (activatedCgnCard) =>
              pipe(
                upsertExpiredCgnCard(
                  userCgnModel,
                  userCgn,
                  activatedCgnCard,
                  expirationDate,
                ),
                TE.map(() => true),
              ),
          ),
        ),
      () => TE.of(false),
    ),
  );

const expireEycaCardIfActivated = (
  userEycaCardModel: UserEycaCardModel,
  userEycaCard: UserEycaCard,
  expirationDate: Date,
) =>
  pipe(
    userEycaCard.card,
    CardExpired.decode,
    E.fold(
      () =>
        pipe(
          userEycaCard.card,
          EycaCardActivated.decode,
          E.fold(
            () => TE.of(false),
            (activatedEycaCard) =>
              pipe(
                upsertExpiredEycaCard(
                  userEycaCardModel,
                  userEycaCard,
                  activatedEycaCard,
                  expirationDate,
                ),
                TE.map(() => true),
              ),
          ),
        ),
      () => TE.of(false),
    ),
  );

const expireCgnIfNeeded = (
  userCgnModel: UserCgnModel,
  recoveryMessage: RecoveryMessage,
  cgnUpperBoundAge: NonNegativeInteger,
) =>
  pipe(
    checkCgnRequirements(recoveryMessage.fiscal_code, cgnUpperBoundAge),
    TE.chain((isCgnEligible) =>
      isCgnEligible
        ? TE.of(false)
        : pipe(
            extractCgnExpirationDate(
              recoveryMessage.fiscal_code,
              cgnUpperBoundAge,
            ),
            TE.chain((expirationDate) =>
              pipe(
                userCgnModel.findLastVersionByModelId([
                  recoveryMessage.fiscal_code,
                ]),
                TE.mapLeft(
                  (cosmosErrors) =>
                    new Error(`${cosmosErrors.kind}|Cannot query cosmos CGN`),
                ),
                TE.chainW(
                  O.fold(
                    () => TE.of(false),
                    (userCgn) =>
                      expireCgnCardIfActivated(
                        userCgnModel,
                        userCgn,
                        expirationDate,
                      ),
                  ),
                ),
              ),
            ),
          ),
    ),
  );

const expireEycaIfNeeded = (
  userEycaCardModel: UserEycaCardModel,
  recoveryMessage: RecoveryMessage,
  eycaUpperBoundAge: NonNegativeInteger,
) =>
  pipe(
    TE.fromEither(
      isEycaEligible(recoveryMessage.fiscal_code, eycaUpperBoundAge),
    ),
    TE.chain((isEligibleForEyca) =>
      isEligibleForEyca
        ? TE.of(false)
        : pipe(
            TE.fromEither(
              extractEycaExpirationDate(
                recoveryMessage.fiscal_code,
                eycaUpperBoundAge,
              ),
            ),
            TE.chain((expirationDate) =>
              pipe(
                userEycaCardModel.findLastVersionByModelId([
                  recoveryMessage.fiscal_code,
                ]),
                TE.mapLeft(
                  (cosmosErrors) =>
                    new Error(`${cosmosErrors.kind}|Cannot query cosmos EYCA`),
                ),
                TE.chainW(
                  O.fold(
                    () => TE.of(false),
                    (userEycaCard) =>
                      expireEycaCardIfActivated(
                        userEycaCardModel,
                        userEycaCard,
                        expirationDate,
                      ),
                  ),
                ),
              ),
            ),
          ),
    ),
  );

export const handler =
  (
    userCgnModel: UserCgnModel,
    userEycaCardModel: UserEycaCardModel,
    cgnUpperBoundAge: NonNegativeInteger,
    eycaUpperBoundAge: NonNegativeInteger,
  ) =>
  (
    recoveryMessage: RecoveryMessage,
    context: InvocationContext,
  ): Promise<boolean> =>
    pipe(
      expireCgnIfNeeded(userCgnModel, recoveryMessage, cgnUpperBoundAge),
      TE.chain(() =>
        expireEycaIfNeeded(
          userEycaCardModel,
          recoveryMessage,
          eycaUpperBoundAge,
        ),
      ),
      TE.map(() => true),
      TE.mapLeft(
        trackError(
          context,
          `[${recoveryMessage.request_id}] CardsRecovery_2_ProcessQueue`,
        ),
      ),
      TE.mapLeft(throwError),
      TE.toUnion,
    )();
