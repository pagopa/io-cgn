import { Context } from "@azure/functions";
import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { ServicesAPIClient } from "../clients/services";
import { StatusEnum as ActivatedStatusEnum } from "../generated/definitions/CardActivated";
import { StatusEnum as PendingStatusEnum } from "../generated/definitions/CardPending";
import { Activation } from "../generated/services-api/Activation";
import {
  ActivationStatus,
  ActivationStatusEnum,
} from "../generated/services-api/ActivationStatus";
import { UserCgn, UserCgnModel } from "../models/user_cgn";
import { CardPendingMessage } from "../types/queue-message";
import { isCardActivated } from "../utils/cgn_checks";
import { errorsToError } from "../utils/conversions";
import { throwError, trackError } from "../utils/errors";
import { QueueStorage } from "../utils/queue";
import { StoreCardExpirationFunction } from "../utils/table_storage";

/**
 * Upsert CGN Card on cosmos
 * @returns UserCgn
 */
const upsertCgnCard = (userCgnModel: UserCgnModel, fiscalCode: FiscalCode) =>
  pipe(
    userCgnModel.upsert({
      card: { status: PendingStatusEnum.PENDING },
      fiscalCode,
      id: `${fiscalCode}-0000000000000000` as NonEmptyString, // this will be replaced by upsert internally
      kind: "INewUserCgn",
    }),
    TE.mapLeft(
      (cosmosErrors) =>
        new Error(`${cosmosErrors.kind}|Cannot upsert cosmos CGN`),
    ),
    TE.chain(flow(UserCgn.decode, TE.fromEither, TE.mapLeft(errorsToError))),
  );

/**
 * Creates a new CGN CARD or gets the already existing for the user
 * @param userCgnModel
 * @param fiscalCode
 * @returns TaskEither<Error,UserCgn>
 */
const createOrGetCgnCard = (
  userCgnModel: UserCgnModel,
  fiscalCode: FiscalCode,
): TE.TaskEither<Error, UserCgn> =>
  pipe(
    userCgnModel.findLastVersionByModelId([fiscalCode]),
    TE.mapLeft(
      (cosmosErrors) =>
        new Error(`${cosmosErrors.kind}|Cannot query cosmos CGN`),
    ),
    TE.chainW(
      O.fold(
        () => upsertCgnCard(userCgnModel, fiscalCode),
        (userCgn) => TE.of(userCgn),
      ),
    ),
  );

/**
 * Check wheter the activation has been 200 OK
 * @param res
 * @returns
 */
const isUpsertServiceActivationSuccess = (
  res: IResponseType<number, unknown, never>,
): res is IResponseType<200, Activation, never> => res.status === 200;

/**
 * Maps statuses to error
 * @param res
 * @returns
 */
const mapUpsertServiceActivationFailure = (
  res: IResponseType<number, unknown, never>,
): Error =>
  new Error(
    `Cannot upsert service activation with response code ${res.status}`,
  );

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
      TE.fromPredicate(
        isUpsertServiceActivationSuccess,
        mapUpsertServiceActivationFailure,
      ),
    ),
    TE.map((successResponse) => successResponse.value),
  );

export const handler =
  (
    userCgnModel: UserCgnModel,
    servicesClient: ServicesAPIClient,
    storeCgnExpiration: StoreCardExpirationFunction,
    queueStorage: QueueStorage,
  ) =>
  (context: Context, pendingCgnMessage: CardPendingMessage): Promise<boolean> =>
    pipe(
      // create or get a pending card
      createOrGetCgnCard(userCgnModel, pendingCgnMessage.fiscal_code),
      TE.chain((userCgn) =>
        isCardActivated(userCgn)
          ? // card already activated mean we should go on
            TE.of(userCgn)
          : //else we process
            pipe(
              // upsert special service
              upsertServiceActivation(
                servicesClient,
                ActivationStatusEnum.PENDING,
                pendingCgnMessage.fiscal_code,
              ),
              TE.chain(() =>
                // store expiration date to table storage
                storeCgnExpiration(
                  pendingCgnMessage.fiscal_code,
                  new Date(pendingCgnMessage.activation_date),
                  new Date(pendingCgnMessage.expiration_date),
                ),
              ),
              TE.map(() => userCgn),
            ),
      ),
      TE.chain((userCgn) =>
        // send activated message to queue
        queueStorage.enqueueActivatedCGNMessage({
          activation_date: pendingCgnMessage.activation_date,
          card_id: userCgn.id,
          expiration_date: pendingCgnMessage.expiration_date,
          fiscal_code: pendingCgnMessage.fiscal_code,
          request_id: pendingCgnMessage.request_id,
          status: ActivatedStatusEnum.ACTIVATED,
        }),
      ),
      TE.mapLeft(
        trackError(
          context,
          `[${pendingCgnMessage.request_id}] CgnActivation_2_ProcessPendingQueue`,
        ),
      ),
      TE.mapLeft(throwError),
      TE.toUnion,
    )();
