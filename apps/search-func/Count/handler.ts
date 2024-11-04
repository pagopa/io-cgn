import { Context } from "@azure/functions";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { QueryTypes, Sequelize } from "sequelize";
import { CountResult } from "../generated/definitions/CountResult";
import { errorsToError } from "../utils/conversions";
import { countMerchantsQuery } from "../utils/postgres_queries";

type ResponseTypes = IResponseSuccessJson<CountResult> | IResponseErrorInternal;

type ICountHandler = (context: Context) => Promise<ResponseTypes>;

export const CountHandler = (cgnOperatorDb: Sequelize): ICountHandler => async (
  _
): Promise<ResponseTypes> =>
  pipe(
    TE.tryCatch(
      () =>
        cgnOperatorDb.query(countMerchantsQuery, {
          raw: true,
          type: QueryTypes.SELECT
        }),
      E.toError
    ),
    TE.chain(results =>
      pipe(
        results[0], // there is just a result
        CountResult.decode,
        TE.fromEither,
        TE.mapLeft(errorsToError)
      )
    ),
    TE.bimap(e => ResponseErrorInternal(e.message), ResponseSuccessJson),
    TE.toUnion
  )();

export const Count = (cgnOperatorDb: Sequelize): express.RequestHandler => {
  const handler = CountHandler(cgnOperatorDb);

  const middlewaresWrap = withRequestMiddlewares(ContextMiddleware());

  return wrapRequestHandler(middlewaresWrap(handler));
};
