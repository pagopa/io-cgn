import { InvocationContext } from "@azure/functions";
import { wrapHandlerV4 } from "@pagopa/io-functions-commons/dist/src/utils/azure-functions-v4-express-adapter";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { Card } from "../generated/definitions/Card";
import { UserCgnModel } from "../models/user_cgn";

type ResponseTypes =
  | IResponseErrorInternal
  | IResponseErrorNotFound
  | IResponseSuccessJson<Card>;

type IGetCgnStatusHandler = (
  context: InvocationContext,
  fiscalCode: FiscalCode,
) => Promise<ResponseTypes>;

export function GetCgnStatusHandler(
  userCgnModel: UserCgnModel,
): IGetCgnStatusHandler {
  return async (_, fiscalCode) =>
    pipe(
      userCgnModel.findLastVersionByModelId([fiscalCode]),
      TE.mapLeft(() =>
        ResponseErrorInternal("Error trying to retrieve user's CGN status"),
      ),
      TE.chainW((maybeUserCgn) =>
        pipe(
          maybeUserCgn,
          TE.fromOption(() =>
            ResponseErrorNotFound("Not Found", "User's CGN status not found"),
          ),
        ),
      ),
      TE.map((userCgn) => ResponseSuccessJson(userCgn.card)),
      TE.toUnion,
    )();
}

export function GetCgnStatus(userCgnModel: UserCgnModel) {
  const handler = GetCgnStatusHandler(userCgnModel);

  const middlewares = [
    ContextMiddleware(),
    RequiredParamMiddleware("fiscalcode", FiscalCode),
  ] as const;

  return wrapHandlerV4(middlewares, handler);
}
