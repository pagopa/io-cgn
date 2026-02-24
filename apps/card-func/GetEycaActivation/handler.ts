import { InvocationContext } from "@azure/functions";
import { wrapHandlerV4 } from "@pagopa/io-functions-commons/dist/src/utils/azure-functions-v4-express-adapter";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
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
  context: InvocationContext,
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

export const GetEycaActivation = (userEycaCardModel: UserEycaCardModel) => {
  const handler = GetEycaActivationHandler(userEycaCardModel);

  const middlewares = [
    ContextMiddleware(),
    RequiredParamMiddleware("fiscalcode", FiscalCode),
  ] as const;

  return wrapHandlerV4(middlewares, handler);
};
