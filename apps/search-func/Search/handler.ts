import * as express from "express";

import { Context } from "@azure/functions";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import * as AR from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { QueryTypes, Sequelize } from "sequelize";

import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import { flow, identity, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import { toLowerCase } from "fp-ts/lib/string";

import { SearchRequest } from "../generated/definitions/SearchRequest";
import { SearchResult } from "../generated/definitions/SearchResult";
import MerchantsModel from "../models/MerchantsModel";
import { errorsToError } from "../utils/conversions";
import { selectMerchantsQuery } from "../utils/postgres_queries";

type ResponseTypes =
  | IResponseSuccessJson<SearchResult>
  | IResponseErrorInternal;

type ISearchHandler = (
  context: Context,
  searchRequest: SearchRequest
) => Promise<ResponseTypes>;

export const SearchHandler = (
  cgnOperatorDb: Sequelize
): ISearchHandler => async (_, searchRequest): Promise<ResponseTypes> =>
  pipe(
    TE.tryCatch(
      () =>
        cgnOperatorDb.query(
          selectMerchantsQuery(
            O.fromNullable(searchRequest.token),
            O.fromNullable(searchRequest.page),
            O.fromNullable(searchRequest.pageSize)
          ),
          {
            model: MerchantsModel,
            raw: true,
            replacements: {
              token_filter: `%${pipe(
                O.fromNullable(searchRequest.token),
                O.fold(() => "", identity),
                toLowerCase
              )}%`
            },
            type: QueryTypes.SELECT
          }
        ),
      E.toError
    ),
    TE.map(
      flow(
        AR.map(merchant => ({
          id: merchant.id,
          name: merchant.name,
          description: merchant.description,
          newDiscounts: merchant.new_discounts
        })),
        merchants => ({ items: merchants })
      )
    ),
    TE.chain(
      flow(SearchResult.decode, TE.fromEither, TE.mapLeft(errorsToError))
    ),
    TE.bimap(e => ResponseErrorInternal(e.message), ResponseSuccessJson),
    TE.toUnion
  )();

export const Search = (cgnOperatorDb: Sequelize): express.RequestHandler => {
  const handler = SearchHandler(cgnOperatorDb);

  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredBodyPayloadMiddleware(SearchRequest)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
