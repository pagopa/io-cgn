import { InvocationContext } from "@azure/functions";
import { wrapHandlerV4 } from "@pagopa/io-functions-commons/dist/src/utils/azure-functions-v4-express-adapter";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import {
  IResponseErrorConflict,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseSuccessRedirectToResource,
  ResponseErrorConflict,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseSuccessRedirectToResource,
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { ulid } from "ulid";

import { StatusEnum as PendingStatusEnum } from "../generated/definitions/CardPending";
import { InstanceId } from "../generated/definitions/InstanceId";
import { UserCgnModel } from "../models/user_cgn";
import { CardPendingMessage } from "../types/queue-message";
import {
  checkCgnRequirements,
  extractCgnExpirationDate,
  isCardActivated,
} from "../utils/cgn_checks";
import { trackError } from "../utils/errors";
import { QueueStorage } from "../utils/queue";

type IStartCgnActivationHandler = (
  context: InvocationContext,
  fiscalCode: FiscalCode,
) => Promise<
  | IResponseErrorConflict
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorInternal
  | IResponseSuccessRedirectToResource<InstanceId, InstanceId>
>;

/**
 * Check if a citizen is eligible for CGN activation
 * A citizen is eligible for a CGN while he's from 18 to 35 years old
 * If eligible returns the calculated expiration date for the CGN
 *
 * @param fiscalCode: the citizen's fiscalCode
 */
const getCgnExpirationDataTask = (
  context: InvocationContext,
  fiscalCode: FiscalCode,
  cgnUpperBoundAge: NonNegativeInteger,
): TE.TaskEither<
  IResponseErrorForbiddenNotAuthorized | IResponseErrorInternal,
  Date
> =>
  pipe(
    checkCgnRequirements(fiscalCode, cgnUpperBoundAge),
    TE.mapLeft(trackError(context, "CgnActivation_1_Start")),
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
        TE.mapLeft(trackError(context, "CgnActivation_1_Start")),
        TE.mapLeft(() =>
          ResponseErrorInternal("Cannot perform CGN Eligibility Check"),
        ),
      ),
    ),
  );

/**
 *
 * @param userCgnModel
 * @param fiscalCode
 * @returns
 */
const shouldActivateNewCGN = (
  context: InvocationContext,
  userCgnModel: UserCgnModel,
  fiscalCode: FiscalCode,
): TE.TaskEither<IResponseErrorConflict | IResponseErrorInternal, boolean> =>
  pipe(
    userCgnModel.findLastVersionByModelId([fiscalCode]),
    TE.mapLeft((cosmosErrors) => new Error(cosmosErrors.kind)),
    TE.mapLeft(trackError(context, "CgnActivation_1_Start")),
    TE.mapLeft(() => ResponseErrorInternal("Cannot query for existing CGN")),
    TE.chainW(
      O.fold(
        () => TE.of(true),
        (userCgn) =>
          isCardActivated(userCgn)
            ? pipe(
                TE.left(new Error("CGN already activated")),
                TE.mapLeft(trackError(context, "CgnActivation_1_Start")),
                TE.mapLeft((e) => ResponseErrorConflict(e.message)),
              )
            : // we always try to "re-activate", next flow will be idempotent
              TE.of(true),
      ),
    ),
  );

export const StartCgnActivationHandler =
  (
    userCgnModel: UserCgnModel,
    cgnUpperBoundAge: NonNegativeInteger,
    queueStorage: QueueStorage,
  ): IStartCgnActivationHandler =>
  async (context: InvocationContext, fiscalCode: FiscalCode) =>
    pipe(
      shouldActivateNewCGN(context, userCgnModel, fiscalCode),
      TE.chainW(() =>
        getCgnExpirationDataTask(context, fiscalCode, cgnUpperBoundAge),
      ),
      TE.map(
        (expirationDate) =>
          ({
            activation_date: new Date(),
            expiration_date: expirationDate,
            fiscal_code: fiscalCode,
            request_id: ulid(),
            status: PendingStatusEnum.PENDING,
          }) as CardPendingMessage,
      ),
      TE.chainFirstW((pendingCardMessage) =>
        pipe(
          queueStorage.enqueuePendingCGNMessage(pendingCardMessage),
          TE.mapLeft(trackError(context, "CGN1_StartActivation")),
          TE.mapLeft((e) => ResponseErrorInternal(e.message)),
        ),
      ),
      TE.map((pendingCgnMessage) =>
        pipe(
          {
            id: pendingCgnMessage.request_id.valueOf() as NonEmptyString,
          },
          (instanceid) =>
            ResponseSuccessRedirectToResource(
              instanceid,
              `/api/v1/cgn/${fiscalCode}/delete`,
              instanceid,
            ),
        ),
      ),
      TE.toUnion,
    )();

export const StartCgnActivation = (
  userCgnModel: UserCgnModel,
  cgnUpperBoundAge: NonNegativeInteger,
  queueStorage: QueueStorage,
) => {
  const handler = StartCgnActivationHandler(
    userCgnModel,
    cgnUpperBoundAge,
    queueStorage,
  );
  const middlewares = [
    ContextMiddleware(),
    RequiredParamMiddleware("fiscalcode", FiscalCode),
  ] as const;
  return wrapHandlerV4(middlewares, handler);
};
