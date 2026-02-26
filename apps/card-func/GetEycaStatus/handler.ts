import { InvocationContext } from "@azure/functions";
import { wrapHandlerV4 } from "@pagopa/io-functions-commons/dist/src/utils/azure-functions-v4-express-adapter";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import {
  IResponseErrorConflict,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson,
  ResponseErrorConflict,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { CardActivated } from "../generated/definitions/CardActivated";
import {
  CardPending,
  StatusEnum as PendingStatusEnum,
} from "../generated/definitions/CardPending";
import { EycaCard } from "../generated/definitions/EycaCard";
import { UserCgnModel } from "../models/user_cgn";
import { UserEycaCardModel } from "../models/user_eyca_card";
import { isEycaEligible } from "../utils/cgn_checks";

type ErrorTypes =
  | IResponseErrorConflict
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorInternal
  | IResponseErrorNotFound;
type ResponseTypes = ErrorTypes | IResponseSuccessJson<EycaCard>;

type IGetEycaStatusHandler = (
  context: InvocationContext,
  fiscalCode: FiscalCode,
) => Promise<ResponseTypes>;

const pendingEycaTE = TE.of({
  card: { status: PendingStatusEnum.PENDING },
});

const conflictEycaTE = TE.left(
  ResponseErrorConflict(
    "EYCA Card is missing while citizen is eligible to obtain it",
  ),
);

const timeToWaitInMilliseconds = 60000; // 60 seconds

const tooEarlyToDetermineEycaFailure = (activationDate: Date) =>
  new Date().getTime() - activationDate.getTime() <= timeToWaitInMilliseconds;

export const GetEycaStatusHandler =
  (
    userEycaCardModel: UserEycaCardModel,
    userCgnModel: UserCgnModel,
    eycaUpperBoundAge: NonNegativeInteger,
  ): IGetEycaStatusHandler =>
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async (_, fiscalCode) =>
    pipe(
      isEycaEligible(fiscalCode, eycaUpperBoundAge),
      TE.fromEither,
      TE.mapLeft(() =>
        ResponseErrorInternal("Cannot perform user's EYCA eligibility check"),
      ),
      TE.chainW(
        TE.fromPredicate(
          (isEligible) => isEligible,
          () => ResponseErrorForbiddenNotAuthorized,
        ),
      ),
      TE.chainW(() =>
        pipe(
          userEycaCardModel.findLastVersionByModelId([fiscalCode]),
          TE.mapLeft(() =>
            ResponseErrorInternal(
              "Error trying to retrieve user's EYCA Card status",
            ),
          ),
        ),
      ),
      TE.chainW(
        flow(
          TE.fromOption(() =>
            ResponseErrorNotFound(
              "Not Found",
              "User's EYCA Card status not found",
            ),
          ),
          TE.orElseW((notFoundError) =>
            pipe(
              userCgnModel.findLastVersionByModelId([fiscalCode]),
              TE.mapLeft(() =>
                ResponseErrorInternal(
                  "Error trying to retrieve user's CGN Card status",
                ),
              ),
              TE.chainW((maybeUserCgn) =>
                pipe(
                  maybeUserCgn,
                  TE.fromOption(() => notFoundError),
                ),
              ),
              TE.chainW((userCgn) => {
                const cgnCard = userCgn.card;
                const isCgnPending = CardPending.is(cgnCard);
                const isCgnActivated = CardActivated.is(cgnCard);

                // we check if a cgn card is pending or if a reasonable amount of time
                // is passed from an activated cgn:
                // - if cgn is pending or activated less tha T ago we return a "fake" pending eyca
                // - if it's passed greater that T time then we return a conflict
                // T = 60 seconds
                return isCgnPending ||
                  (isCgnActivated &&
                    tooEarlyToDetermineEycaFailure(cgnCard.activation_date))
                  ? pendingEycaTE
                  : conflictEycaTE;
              }),
            ),
          ),
        ),
      ),
      TE.map((userEycaCard) => ResponseSuccessJson(userEycaCard.card)),
      TE.toUnion,
    )();

export const GetEycaStatus = (
  userEycaCardModel: UserEycaCardModel,
  userCgnModel: UserCgnModel,
  eycaUpperBoundAge: NonNegativeInteger,
) => {
  const handler = GetEycaStatusHandler(
    userEycaCardModel,
    userCgnModel,
    eycaUpperBoundAge,
  );

  const middlewares = [
    ContextMiddleware(),
    RequiredParamMiddleware("fiscalcode", FiscalCode),
  ] as const;

  return wrapHandlerV4(middlewares, handler);
};
