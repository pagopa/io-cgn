import { Context } from "@azure/functions";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { UserInfo } from "../generated/definitions/UserInfo";
import { UserCgnModel } from "../models/user_cgn";
import { UserEycaCardModel } from "../models/user_eyca_card";
import { errorsToError } from "../utils/conversions";

type ResponseTypes =
  | IResponseErrorInternal
  | IResponseErrorNotFound
  | IResponseSuccessJson<UserInfo>;

type IGetUserInfoHandler = (
  context: Context,
  fiscalCode: FiscalCode,
) => Promise<ResponseTypes>;

export function GetUserInfoHandler(
  userCgnModel: UserCgnModel,
  userEycaModel: UserEycaCardModel,
): IGetUserInfoHandler {
  return (_, fiscalCode) =>
    pipe(
      userCgnModel.findLastVersionByModelId([fiscalCode]),
      TE.mapLeft(() =>
        ResponseErrorInternal("Error trying to retrieve user's CGN card"),
      ),
      TE.chainW((maybeUserCgn) =>
        pipe(
          maybeUserCgn,
          TE.fromOption(() =>
            ResponseErrorNotFound("Not Found", "User's CGN status not found"),
          ),
          TE.map((userCgnCard) => userCgnCard.card),
        ),
      ),
      TE.chainW((cgnCard) =>
        pipe(
          userEycaModel.findLastVersionByModelId([fiscalCode]),
          TE.mapLeft(() =>
            ResponseErrorInternal("Error trying to retrieve user's Eyca card"),
          ),
          TE.chainW((maybeUserEycaCard) =>
            pipe(
              maybeUserEycaCard,
              O.fold(
                () =>
                  UserInfo.decode({
                    cgn_card: cgnCard,
                  }),
                (userEycaCard) =>
                  UserInfo.decode({
                    cgn_card: cgnCard,
                    eyca_card: userEycaCard.card,
                  }),
              ),
              TE.fromEither,
              TE.mapLeft((e) =>
                ResponseErrorInternal(
                  `Cannot decode UserInfo | ${errorsToError(e)}`,
                ),
              ),
            ),
          ),
        ),
      ),
      TE.map((userInfo) => ResponseSuccessJson(userInfo)),
      TE.toUnion,
    )();
}

export function GetUserInfo(
  userCgnModel: UserCgnModel,
  userEycaModel: UserEycaCardModel,
): express.RequestHandler {
  const handler = GetUserInfoHandler(userCgnModel, userEycaModel);

  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredParamMiddleware("fiscalcode", FiscalCode),
  );

  return wrapRequestHandler(middlewaresWrap(handler));
}
