import { Context } from "@azure/functions";
import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as AR from "fp-ts/ReadonlyArray";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { ServicesAPIClient } from "../clients/services";
import {
  CardPendingDelete,
  StatusEnum as PendingDeleteStatusEnum,
} from "../generated/definitions/CardPendingDelete";
import { CommonCard } from "../generated/definitions/CommonCard";
import { Activation } from "../generated/services-api/Activation";
import {
  ActivationStatus,
  ActivationStatusEnum,
} from "../generated/services-api/ActivationStatus";
import { UserCgn, UserCgnModel } from "../models/user_cgn";
import { CardPendingDeleteMessage } from "../types/queue-message";
import { errorsToError } from "../utils/conversions";
import { throwError, trackError } from "../utils/errors";
import { DeleteCardExpirationFunction } from "../utils/table_storage";

/**
 * Upsert a PENDING_DELETE CGN Card on cosmos
 * @returns UserCgn
 */
const upsertPendingDeleteCgnCard = (
  userCgnModel: UserCgnModel,
  userCgn: UserCgn,
  commonCard: CommonCard,
  fiscalCode: FiscalCode,
) =>
  pipe(
    userCgnModel.upsert({
      ...userCgn,
      card: {
        ...commonCard,
        status: PendingDeleteStatusEnum.PENDING_DELETE,
      },
      fiscalCode,
      kind: "INewUserCgn",
    }),
    TE.mapLeft(
      (cosmosErrors) =>
        new Error(`${cosmosErrors.kind}|Cannot upsert cosmos CGN`),
    ),
  );

/**
 * Creates a pending delete CGN CARD or gets the already existing for the user
 * @param userCgnModel
 * @param fiscalCode
 * @returns TaskEither<Error,UserCgn>
 */
const createOrGetPendingDeleteCgnCard = (
  userCgnModel: UserCgnModel,
  fiscalCode: FiscalCode,
): TE.TaskEither<Error, O.Option<UserCgn>> =>
  pipe(
    userCgnModel.findLastVersionByModelId([fiscalCode]),
    TE.mapLeft(
      (cosmosErrors) =>
        new Error(`${cosmosErrors.kind}|Cannot query cosmos CGN`),
    ),
    TE.chainW(
      O.fold(
        // if no cgn is present we have to do nothing
        () => TE.of(O.none),
        (userCgn) =>
          CardPendingDelete.is(userCgn.card)
            ? TE.of(O.some(userCgn))
            : pipe(
                userCgn.card,
                CommonCard.decode,
                TE.fromEither,
                TE.mapLeft(() => new Error("Card is not activated")),
                TE.chainW((commonCard) =>
                  upsertPendingDeleteCgnCard(
                    userCgnModel,
                    userCgn,
                    commonCard,
                    fiscalCode,
                  ),
                ),
                TE.map(O.some),
              ),
      ),
    ),
  );

/**
 * Deletes all the UserCgn cards from cosmos db
 * @param userCgnModel
 * @param fiscalCode
 * @returns
 */
const deleteAllCgnCards = (
  userCgnModel: UserCgnModel,
  fiscalCode: FiscalCode,
) =>
  pipe(
    userCgnModel.findAllCgnCards(fiscalCode),
    TE.mapLeft(() => new Error("Cannot retrieve all cgn card")),
    TE.chainW((cards) =>
      pipe(
        AR.sequence(TE.ApplicativePar)(
          cards.map((element) =>
            userCgnModel.deleteVersion(element.fiscalCode, element.id),
          ),
        ),
        TE.mapLeft(() => new Error("Cannot delete cgn version")),
      ),
    ),
  );

/**
 * Check wheter the upsert service has been 200 OK
 * @param res
 * @returns
 */
const isUpsertServiceSuccess = (
  res: IResponseType<number, unknown, never>,
): res is IResponseType<200, Activation, never> => res.status === 200;

/**
 * Maps statuses to error
 * @param res
 * @returns
 */
const mapUpsertServiceFailure = (
  res: IResponseType<number, unknown, never>,
): Error => new Error(`Cannot upsert service with response code ${res.status}`);

/**
 * Upsert special service
 * @param servicesClient
 * @param activationStatus
 * @param fiscalCode
 * @returns
 */
const upsertServiceActivation = (
  servicesClient: ServicesAPIClient,
  activationStatus: ActivationStatus,
  fiscalCode: FiscalCode,
): TE.TaskEither<Error, Activation> =>
  pipe(
    TE.tryCatch(
      async () =>
        servicesClient.upsertServiceActivation({
          payload: { fiscal_code: fiscalCode, status: activationStatus },
        }),
      E.toError,
    ),
    TE.chainW(flow(TE.fromEither, TE.mapLeft(errorsToError))),
    TE.chainW(
      TE.fromPredicate(isUpsertServiceSuccess, mapUpsertServiceFailure),
    ),
    TE.map((successResponse) => successResponse.value),
  );

export const handler =
  (
    userCgnModel: UserCgnModel,
    servicesClient: ServicesAPIClient,
    deleteCgnExpiration: DeleteCardExpirationFunction,
  ) =>
  (
    context: Context,
    pendingDeleteCgnMessage: CardPendingDeleteMessage,
  ): Promise<boolean> =>
    pipe(
      // create or get a pending delete card
      createOrGetPendingDeleteCgnCard(
        userCgnModel,
        pendingDeleteCgnMessage.fiscal_code,
      ),
      TE.chain(
        O.fold(
          // no cgn present means it was already deleted
          () => TE.of(true),
          // if cgn is pending delete we do the delete procedure
          () =>
            pipe(
              // upsert special service
              upsertServiceActivation(
                servicesClient,
                ActivationStatusEnum.PENDING,
                pendingDeleteCgnMessage.fiscal_code,
              ),
              TE.chain(() =>
                // delete expiration date from table storage
                deleteCgnExpiration(
                  pendingDeleteCgnMessage.fiscal_code,
                  new Date(pendingDeleteCgnMessage.expiration_date),
                ),
              ),
              TE.chain(() =>
                // Delete all user cgn
                deleteAllCgnCards(
                  userCgnModel,
                  pendingDeleteCgnMessage.fiscal_code,
                ),
              ),
              TE.chain(() =>
                // upsert special service
                upsertServiceActivation(
                  servicesClient,
                  ActivationStatusEnum.INACTIVE,
                  pendingDeleteCgnMessage.fiscal_code,
                ),
              ),
              TE.map(() => true),
            ),
        ),
      ),
      TE.mapLeft(
        trackError(
          context,
          `[${pendingDeleteCgnMessage.request_id}] CardDelete_2_ProcessPendingDeleteCgnQueue`,
        ),
      ),
      TE.mapLeft(throwError),
      TE.toUnion,
    )();
