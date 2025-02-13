import { Context } from "@azure/functions";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { QueryTypes, Sequelize } from "sequelize";

import { CountResult } from "../generated/definitions/CountResult";
import { trackErrorToResponseErrorInternal } from "../utils/appinsights";
import { errorsToError } from "../utils/conversions";
import { countMerchantsQuery } from "../utils/postgres_queries";

type ResponseTypes = IResponseErrorInternal | IResponseSuccessJson<CountResult>;

type ICountHandler = (context: Context) => Promise<ResponseTypes>;

export const CountHandler =
  (cgnOperatorDb: Sequelize): ICountHandler =>
  async (): Promise<ResponseTypes> =>
    pipe(
      TE.tryCatch(
        () =>
          cgnOperatorDb.query(countMerchantsQuery, {
            raw: true,
            type: QueryTypes.SELECT,
          }),
        E.toError,
      ),
      TE.chain((results) =>
        pipe(
          results[0], // there is just a result {count: <N>}
          CountResult.decode,
          TE.fromEither,
          TE.mapLeft(errorsToError),
        ),
      ),
      TE.mapLeft(trackErrorToResponseErrorInternal),
      TE.map(ResponseSuccessJson),
      TE.toUnion,
    )();

export const Count = (cgnOperatorDb: Sequelize): express.RequestHandler => {
  const handler = CountHandler(cgnOperatorDb);
  const middlewaresWrap = withRequestMiddlewares(ContextMiddleware());
  return wrapRequestHandler(middlewaresWrap(handler));
};
