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
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { ulid } from "ulid";

import { CardActivated } from "../generated/definitions/CardActivated";
import {
  CgnActivationDetail,
  StatusEnum,
} from "../generated/definitions/CgnActivationDetail";
import { UserCgnModel } from "../models/user_cgn";
import { retrieveUserCgn } from "../utils/models";

type ResponseTypes =
  | IResponseErrorInternal
  | IResponseErrorNotFound
  | IResponseSuccessJson<CgnActivationDetail>;

type IGetCgnActivationHandler = (
  context: InvocationContext,
  fiscalCode: FiscalCode,
) => Promise<ResponseTypes>;

export const GetCgnActivationHandler =
  (userCgnModel: UserCgnModel): IGetCgnActivationHandler =>
  async (_, fiscalCode) =>
    pipe(
      retrieveUserCgn(userCgnModel, fiscalCode),
      TE.map((userCgn) => userCgn.card),
      TE.chainW((cgn) =>
        pipe(
          TE.of(
            CardActivated.is(cgn) ? StatusEnum.COMPLETED : StatusEnum.PENDING,
          ),
          TE.map((cgnStatus) => ({
            instance_id: { id: ulid() as NonEmptyString },
            status: cgnStatus,
          })),
        ),
      ),
      TE.map(ResponseSuccessJson),
      TE.toUnion,
    )();

export const GetCgnActivation = (userCgnModel: UserCgnModel) => {
  const handler = GetCgnActivationHandler(userCgnModel);

  const middlewares = [
    ContextMiddleware(),
    RequiredParamMiddleware("fiscalcode", FiscalCode),
  ] as const;

  return wrapHandlerV4(middlewares, handler);
};
