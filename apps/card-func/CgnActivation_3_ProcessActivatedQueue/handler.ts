import { Context } from "@azure/functions";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { ServicesAPIClient } from "../clients/services";
import { StatusEnum as PendingStatusEnum } from "../generated/definitions/CardPending";
import { Activation } from "../generated/services-api/Activation";
import {
  ActivationStatus,
  ActivationStatusEnum,
} from "../generated/services-api/ActivationStatus";
import { RetrievedUserCgn, UserCgn, UserCgnModel } from "../models/user_cgn";
import { CardActivatedMessage } from "../types/queue-message";
import {
  extractEycaExpirationDate,
  isCardActivated,
  isEycaEligible,
} from "../utils/cgn_checks";
import { errorsToError } from "../utils/conversions";
import { throwError, trackError } from "../utils/errors";
import { MessageTypeEnum } from "../utils/messages";
import { QueueStorage } from "../utils/queue";

/**
 * Gets a CGN CARD
 * @param userCgnModel
 * @param fiscalCode
 * @returns TaskEither<Error,UserCgn>
 */
const getCgnCard = (
  userCgnModel: UserCgnModel,
  fiscalCode: FiscalCode,
): TE.TaskEither<Error, RetrievedUserCgn> =>
  pipe(
    userCgnModel.findLastVersionByModelId([fiscalCode]),
    TE.mapLeft(
      (cosmosErrors) =>
        new Error(`${cosmosErrors.kind}|Cannot query cosmos CGN`),
    ),
    TE.chainW(
      O.fold(
        () => TE.left(new Error(`Cannot find requested CGN`)),
        (userCgn) => TE.of(userCgn),
      ),
    ),
  );

/**
 * Update a CGN CARD
 * @param userCgnModel
 * @param fiscalCode
 * @returns TaskEither<Error,UserCgn>
 */
const updateCgnCard = (
  userCgnModel: UserCgnModel,
  userCgn: RetrievedUserCgn,
): TE.TaskEither<Error, UserCgn> =>
  pipe(
    userCgnModel.update(userCgn),
    TE.mapLeft(
      (cosmosErrors) =>
        new Error(`${cosmosErrors.kind}|Cannot update cosmos CGN`),
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

/**
 * Get eyca expiration date if eligible
 * @param fiscalCode
 * @param eycaUpperBoundAge
 * @returns
 */
const getEycaExpirationDateIfEligibleTask = (
  fiscalCode: FiscalCode,
  eycaUpperBoundAge: NonNegativeInteger,
) =>
  pipe(
    E.Do,
    E.bind("expirationDate", () =>
      extractEycaExpirationDate(fiscalCode, eycaUpperBoundAge),
    ),
    E.bind("isEligibile", () => isEycaEligible(fiscalCode, eycaUpperBoundAge)),
    TE.fromEither,
    TE.map((eycaEligibilityInfo) =>
      eycaEligibilityInfo.isEligibile
        ? O.some(eycaEligibilityInfo.expirationDate)
        : O.none,
    ),
  );

export const handler =
  (
    userCgnModel: UserCgnModel,
    servicesClient: ServicesAPIClient,
    queueStorage: QueueStorage,
    eycaUpperBoundAge: NonNegativeInteger,
  ) =>
  (
    context: Context,
    activatedCgnMessage: CardActivatedMessage,
  ): Promise<boolean> =>
    pipe(
      // get the card
      getCgnCard(userCgnModel, activatedCgnMessage.fiscal_code),
      TE.chain((userCgn) =>
        isCardActivated(userCgn)
          ? // card already activated mean we should go on
            TE.of(true)
          : // else we process
            pipe(
              // upsert special service
              upsertServiceActivation(
                servicesClient,
                ActivationStatusEnum.ACTIVE,
                activatedCgnMessage.fiscal_code,
              ),
              TE.chain(() =>
                // update card with activation data
                updateCgnCard(userCgnModel, {
                  ...userCgn,
                  card: {
                    activation_date: activatedCgnMessage.activation_date,
                    expiration_date: activatedCgnMessage.expiration_date,
                    status: activatedCgnMessage.status,
                  },
                }),
              ),
              TE.chain((userCgn) =>
                pipe(
                  // get eyca expiration date if eligible
                  getEycaExpirationDateIfEligibleTask(
                    activatedCgnMessage.fiscal_code,
                    eycaUpperBoundAge,
                  ),
                  TE.chainFirstW(
                    O.fold(
                      // no expiration date means no eyca eligibility
                      () => TE.of(true),
                      // send pending eyca message to queue
                      (expirationDate) =>
                        queueStorage.enqueuePendingEYCAMessage({
                          activation_date: new Date(),
                          expiration_date: expirationDate,
                          fiscal_code: activatedCgnMessage.fiscal_code,
                          request_id: activatedCgnMessage.request_id,
                          status: PendingStatusEnum.PENDING,
                        }),
                    ),
                  ),
                  TE.chainW(
                    O.fold(
                      // no expiration date means send CGN activation message
                      () =>
                        queueStorage.enqueueMessageToSendMessage({
                          card: userCgn.card,
                          fiscal_code: activatedCgnMessage.fiscal_code,
                          message_type: MessageTypeEnum.CARD_ACTIVATED,
                        }),
                      // if we activate also eyca we should send message after eyca activation
                      () => TE.of(true),
                    ),
                  ),
                ),
              ),
            ),
      ),
      TE.mapLeft(
        trackError(
          context,
          `[${activatedCgnMessage.request_id}] CgnActivation_3_ProcessActivatedQueue`,
        ),
      ),
      TE.mapLeft(throwError),
      TE.toUnion,
    )();
