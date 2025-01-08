import { Context } from "@azure/functions";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
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
import * as AR from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, identity, pipe } from "fp-ts/lib/function";
import { toLowerCase } from "fp-ts/lib/string";
import { QueryTypes, Sequelize } from "sequelize";

import { SearchRequest } from "../generated/definitions/SearchRequest";
import { SearchResult } from "../generated/definitions/SearchResult";
import MerchantsModel from "../models/MerchantsModel";
import { trackErrorToResponseErrorInternal } from "../utils/appinsights";
import { errorsToError } from "../utils/conversions";
import { selectMerchantsQuery } from "../utils/postgres_queries";

type ResponseTypes =
  | IResponseErrorInternal
  | IResponseSuccessJson<SearchResult>;

type ISearchHandler = (
  context: Context,
  searchRequest: SearchRequest,
) => Promise<ResponseTypes>;

export const SearchHandler =
  (cgnOperatorDb: Sequelize): ISearchHandler =>
  async (_, searchRequest): Promise<ResponseTypes> =>
    pipe(
      TE.tryCatch(
        () =>
          searchRequest.token && searchRequest.token.length >= 3
            ? // we query db only if searchRequest.token.length >= 3
              cgnOperatorDb.query(
                selectMerchantsQuery(
                  O.fromNullable(searchRequest.token),
                  O.fromNullable(searchRequest.page),
                  O.fromNullable(searchRequest.pageSize),
                ),
                {
                  model: MerchantsModel,
                  raw: true,
                  replacements: {
                    token_filter: `%${pipe(
                      O.fromNullable(searchRequest.token),
                      O.fold(() => "", identity),
                      toLowerCase,
                    )}%`,
                  },
                  type: QueryTypes.SELECT,
                },
              )
            : // else we return empty list
              Promise.resolve([]),
        E.toError,
      ),
      TE.map(
        flow(
          AR.map((merchant) => ({
            description: merchant.description,
            id: merchant.id,
            name: merchant.name,
            newDiscounts: merchant.new_discounts,
          })),
          (merchants) => ({ items: merchants }),
        ),
      ),
      TE.chain(
        flow(SearchResult.decode, TE.fromEither, TE.mapLeft(errorsToError)),
      ),
      TE.bimap(trackErrorToResponseErrorInternal, ResponseSuccessJson),
      TE.toUnion,
    )();

export const Search = (cgnOperatorDb: Sequelize): express.RequestHandler => {
  const handler = SearchHandler(cgnOperatorDb);

  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredBodyPayloadMiddleware(SearchRequest),
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
