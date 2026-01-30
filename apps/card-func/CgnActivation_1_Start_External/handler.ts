import { Context } from "@azure/functions";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import {
  IResponseErrorConflict,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessAccepted,
  ResponseErrorConflict,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessAccepted,
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { ulid } from "ulid";

import { ServicesAPIClient } from "../clients/services";
import { StatusEnum as PendingStatusEnum } from "../generated/definitions/CardPending";
import { FiscalCodePayload } from "../generated/definitions-external-activation/FiscalCodePayload";
import { LimitedProfile } from "../generated/services-api/LimitedProfile";
import { ProblemJson } from "../generated/services-api-messages/ProblemJson";
import { UserCgnModel } from "../models/user_cgn";
import { CardPendingMessage } from "../types/queue-message";
import {
  checkCgnRequirements,
  extractCgnExpirationDate,
  isCardActivated,
} from "../utils/cgn_checks";
import { errorsToError } from "../utils/conversions";
import { trackError } from "../utils/errors";
import { QueueStorage } from "../utils/queue";

type IStartCgnActivationHandler = (
  context: Context,
  fiscalCodePayload: FiscalCodePayload,
) => Promise<
  | IResponseErrorConflict
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorInternal
  | IResponseErrorNotFound
  | IResponseSuccessAccepted<undefined>
>;

/**
 * Check if a citizen is eligible for CGN activation
 * A citizen is eligible for a CGN while he's from 18 to 35 years old
 * If eligible returns the calculated expiration date for the CGN
 *
 * @param fiscalCode: the citizen's fiscalCode
 */
const getCgnExpirationDataTask = (
  context: Context,
  fiscalCode: FiscalCode,
  cgnUpperBoundAge: NonNegativeInteger,
): TE.TaskEither<
  IResponseErrorForbiddenNotAuthorized | IResponseErrorInternal,
  Date
> =>
  pipe(
    checkCgnRequirements(fiscalCode, cgnUpperBoundAge),
    TE.mapLeft(trackError(context, "CgnActivation_1_Start_External")),
    TE.mapLeft(() =>
      ResponseErrorInternal("Cannot perform CGN Eligibility Check"),
    ),
    TE.chainW(
      TE.fromPredicate(
        (isEligible) => isEligible === true,
        () => ResponseErrorForbiddenNotAuthorized,
      ),
    ),
    TE.chainW(() =>
      pipe(
        extractCgnExpirationDate(fiscalCode, cgnUpperBoundAge),
        TE.mapLeft(trackError(context, "CgnActivation_1_Start_External")),
        TE.mapLeft(() =>
          ResponseErrorInternal("Cannot perform CGN Eligibility Check"),
        ),
      ),
    ),
  );

/**
 * Check wheter we can use the response as success
 * @param res
 * @returns
 */
const isGetProfileSuccess = (
  res: IResponseType<number, unknown, never>,
): res is
  | IResponseType<200, LimitedProfile, never>
  | IResponseType<404, ProblemJson, never> =>
  res.status === 200 || res.status === 404;

/**
 * Maps statuses to error
 * @param res
 * @returns
 */
const mapGetProfileFailure = (
  res: IResponseType<number, unknown, never>,
): Error => new Error(`Cannot get profile with response code ${res.status}`);

/**
 * Get citizen profile
 * @param servicesClient
 * @param fiscalCode
 * @returns
 */
const getProfile = (
  servicesClient: ServicesAPIClient,
  fiscalCode: FiscalCode,
): TE.TaskEither<Error, O.Option<LimitedProfile>> =>
  pipe(
    TE.tryCatch(
      async () =>
        servicesClient.getProfileByPOST({
          payload: { fiscal_code: fiscalCode },
        }),
      E.toError,
    ),
    TE.chainW(flow(TE.fromEither, TE.mapLeft(errorsToError))),
    TE.chainW(TE.fromPredicate(isGetProfileSuccess, mapGetProfileFailure)),
    TE.map((successResponse) =>
      LimitedProfile.is(successResponse.value)
        ? O.some(successResponse.value)
        : O.none,
    ),
  );

/**
 *
 * @param userCgnModel
 * @param fiscalCode
 * @returns
 */
const shouldActivateNewCGN = (
  context: Context,
  servicesClient: ServicesAPIClient,
  userCgnModel: UserCgnModel,
  fiscalCode: FiscalCode,
): TE.TaskEither<
  IResponseErrorConflict | IResponseErrorInternal | IResponseErrorNotFound,
  boolean
> =>
  pipe(
    // check if profile exists
    getProfile(servicesClient, fiscalCode),
    TE.mapLeft(trackError(context, "CgnActivation_1_Start_External")),
    TE.mapLeft(() => ResponseErrorInternal("Cannot call getProfile API")),
    TE.chainW(
      flow(
        TE.fromOption(() => new Error("Profile not found")),
        TE.mapLeft((e) =>
          ResponseErrorNotFound(
            e.message,
            "Cannot find profile for the given fiscal code",
          ),
        ),
      ),
    ),
    TE.chainW(() =>
      // check if CGN already exists
      pipe(
        userCgnModel.findLastVersionByModelId([fiscalCode]),
        TE.mapLeft((cosmosErrors) => new Error(cosmosErrors.kind)),
        TE.mapLeft(trackError(context, "CgnActivation_1_Start_External")),
        TE.mapLeft(() =>
          ResponseErrorInternal("Cannot query for existing CGN"),
        ),
      ),
    ),
    TE.chainW(
      O.fold(
        // no existing CGN, we can activate a new one
        () => TE.of(true),
        // existing CGN found, check if already activated
        (userCgn) =>
          isCardActivated(userCgn)
            ? // already activated CGN, cannot activate a new one
              pipe(
                TE.left(new Error("CGN already activated")),
                TE.mapLeft(
                  trackError(context, "CgnActivation_1_Start_External"),
                ),
                TE.mapLeft((e) => ResponseErrorConflict(e.message)),
              )
            : // if not activated we try to "re-activate", next flow will be idempotent
              TE.of(true),
      ),
    ),
  );

export const StartCgnActivationHandler =
  (
    servicesClient: ServicesAPIClient,
    userCgnModel: UserCgnModel,
    cgnUpperBoundAge: NonNegativeInteger,
    queueStorage: QueueStorage,
  ): IStartCgnActivationHandler =>
  async (context: Context, fiscalCodePayload: FiscalCodePayload) =>
    pipe(
      shouldActivateNewCGN(
        context,
        servicesClient,
        userCgnModel,
        fiscalCodePayload.fiscal_code,
      ),
      TE.chainW(() =>
        getCgnExpirationDataTask(
          context,
          fiscalCodePayload.fiscal_code,
          cgnUpperBoundAge,
        ),
      ),
      TE.map(
        (expirationDate) =>
          ({
            activation_date: new Date(),
            expiration_date: expirationDate,
            fiscal_code: fiscalCodePayload.fiscal_code,
            request_id: ulid(),
            status: PendingStatusEnum.PENDING,
          }) as CardPendingMessage,
      ),
      TE.chainFirstW((pendingCardMessage) =>
        pipe(
          queueStorage.enqueuePendingCGNMessage(pendingCardMessage),
          TE.mapLeft(trackError(context, "CgnActivation_1_Start_External")),
          TE.mapLeft((e) => ResponseErrorInternal(e.message)),
        ),
      ),
      TE.map(() => ResponseSuccessAccepted(undefined, undefined)),
      TE.toUnion,
    )();

export const StartCgnActivation = (
  servicesClient: ServicesAPIClient,
  userCgnModel: UserCgnModel,
  cgnUpperBoundAge: NonNegativeInteger,
  queueStorage: QueueStorage,
): express.RequestHandler => {
  const handler = StartCgnActivationHandler(
    servicesClient,
    userCgnModel,
    cgnUpperBoundAge,
    queueStorage,
  );
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredBodyPayloadMiddleware(FiscalCodePayload),
  );
  return wrapRequestHandler(middlewaresWrap(handler));
};
