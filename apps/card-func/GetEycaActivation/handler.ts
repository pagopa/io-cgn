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
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { CardActivated } from "../generated/definitions/CardActivated";
import { StatusEnum } from "../generated/definitions/CgnActivationDetail";
import { EycaActivationDetail } from "../generated/definitions/EycaActivationDetail";
import { UserEycaCardModel } from "../models/user_eyca_card";
import { retrieveUserEycaCard } from "../utils/models";

type ResponseTypes =
  | IResponseErrorInternal
  | IResponseErrorNotFound
  | IResponseSuccessJson<EycaActivationDetail>;

type IGetEycaActivationHandler = (
  context: Context,
  fiscalCode: FiscalCode,
) => Promise<ResponseTypes>;

export const GetEycaActivationHandler =
  (userEycaCardModel: UserEycaCardModel): IGetEycaActivationHandler =>
  async (
    _,
    fiscalCode, // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  ) =>
    pipe(
      retrieveUserEycaCard(userEycaCardModel, fiscalCode),
      TE.map((userEycaCard) => userEycaCard.card),
      TE.chainW((eycaCard) =>
        pipe(
          TE.of(
            CardActivated.is(eycaCard)
              ? StatusEnum.COMPLETED
              : StatusEnum.PENDING,
          ),
          TE.map((status) => ({ status })),
        ),
      ),
      TE.map(ResponseSuccessJson),
      TE.toUnion,
    )();

export const GetEycaActivation = (
  userEycaCardModel: UserEycaCardModel,
): express.RequestHandler => {
  const handler = GetEycaActivationHandler(userEycaCardModel);

  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredParamMiddleware("fiscalcode", FiscalCode),
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
