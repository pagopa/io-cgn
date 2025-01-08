import { Context } from "@azure/functions";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessAccepted,
  ResponseErrorConflict,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessAccepted,
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { CardActivated } from "../generated/definitions/CardActivated";
import { StatusEnum } from "../generated/definitions/CardRevoked";
import { CgnStatusUpsertRequest } from "../generated/definitions/CgnStatusUpsertRequest";
import { UserCgnModel } from "../models/user_cgn";
import { trackErrorAndReturnResponse } from "../utils/errors";

type ErrorTypes =
  | IResponseErrorConflict
  | IResponseErrorInternal
  | IResponseErrorNotFound;

type ReturnTypes = ErrorTypes | IResponseSuccessAccepted<void>;

type IUpsertCgnStatusHandler = (
  context: Context,
  fiscalCode: FiscalCode,
  cgnStatusUpsertRequest: CgnStatusUpsertRequest,
) => Promise<ReturnTypes>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const toCgnStatus = (cgnStatusUpsertRequest: CgnStatusUpsertRequest) => ({
  revocation_date: new Date(),
  revocation_reason: cgnStatusUpsertRequest.revocation_reason,
  status: StatusEnum.REVOKED,
});

export const UpsertCgnStatusHandler =
  (userCgnModel: UserCgnModel): IUpsertCgnStatusHandler =>
  async (context, fiscalCode, cgnStatusUpsertRequest): Promise<ReturnTypes> =>
    pipe(
      cgnStatusUpsertRequest,
      TE.of,
      TE.chain((upsertRequest) =>
        pipe(
          userCgnModel.findLastVersionByModelId([fiscalCode]),
          TE.mapLeft(() =>
            trackErrorAndReturnResponse(
              context,
              "UpserCgnStatus",
              "Cosmos query internal error",
              ResponseErrorInternal("Cosmos query internal error"),
            ),
          ),
          TE.chainW(
            O.fold(
              () =>
                TE.left(
                  trackErrorAndReturnResponse(
                    context,
                    "UpserCgnStatus",
                    "CGN not found",
                    ResponseErrorNotFound("Not found", "User's CGN not found"),
                  ),
                ),
              (userCgn) => TE.of(userCgn),
            ),
          ),
          TE.chainW((userCgn) =>
            pipe(
              userCgn.card,
              TE.fromPredicate(CardActivated.is, () =>
                trackErrorAndReturnResponse(
                  context,
                  "UpserCgnStatus",
                  "Cannot revoke a non active CGN",
                  ResponseErrorConflict("Cannot revoke a non active CGN"),
                ),
              ),
              TE.map((activatedCard) => ({ activatedCard, userCgn })),
            ),
          ),
          TE.chainW(({ activatedCard, userCgn }) =>
            pipe(
              userCgnModel.upsert({
                ...userCgn,
                card: {
                  activation_date: activatedCard.activation_date,
                  expiration_date: activatedCard.expiration_date,
                  ...toCgnStatus(upsertRequest),
                },
                kind: "INewUserCgn",
              }),
              TE.mapLeft(() =>
                trackErrorAndReturnResponse(
                  context,
                  "UpserCgnStatus",
                  "Cosmos upsert internal error",
                  ResponseErrorInternal("Cosmos upsert internal error"),
                ),
              ),
            ),
          ),
          // TODO: Send revoked message
        ),
      ),
      // eslint-disable-next-line
      TE.map(() => ResponseSuccessAccepted<void>("Revoke request accepted")),
      TE.toUnion,
    )();

export const UpsertCgnStatus = (
  userCgnModel: UserCgnModel,
): express.RequestHandler => {
  const handler = UpsertCgnStatusHandler(userCgnModel);

  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredParamMiddleware("fiscalcode", FiscalCode),
    RequiredBodyPayloadMiddleware(CgnStatusUpsertRequest),
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
