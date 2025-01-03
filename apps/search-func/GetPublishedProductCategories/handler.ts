import * as express from "express";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as AR from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import { Sequelize, QueryTypes } from "sequelize";
import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";
import { pipe, flow, identity } from "fp-ts/lib/function";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import { ProductCategoryFromModel } from "../models/ProductCategories";
import PublishedProductCategoryModel from "../models/PublishedProductCategoryModel";
import { SelectPublishedProductCategories } from "../utils/postgres_queries";
import { errorsToError } from "../utils/conversions";
import { PublishedProductCategoriesResult } from "../generated/definitions/PublishedProductCategoriesResult";
import { OptionalQueryParamMiddleware } from "../middlewares/optional_query_param";
import { trackErrorToResponseErrorInternal } from "../utils/appinsights";

type ResponseTypes =
  | IResponseSuccessJson<PublishedProductCategoriesResult>
  | IResponseErrorInternal;

type IGetPublishedProductCategoriesHandler = (
  maybeCountNewDiscounts: O.Option<boolean>
) => Promise<ResponseTypes>;

export const GetPublishedProductCategoriesHandler = (
  cgnOperatorDb: Sequelize
): IGetPublishedProductCategoriesHandler => async (
  maybeCountNewDiscounts: O.Option<boolean>
): Promise<ResponseTypes> =>
  pipe(
    TE.tryCatch(
      () =>
        cgnOperatorDb.query(SelectPublishedProductCategories, {
          model: PublishedProductCategoryModel,
          raw: true,
          type: QueryTypes.SELECT
        }),
      E.toError
    ),
    TE.map(
      flow(
        AR.map(productCategoryModel => ({
          newDiscounts: productCategoryModel.new_discounts,
          productCategory: ProductCategoryFromModel(
            productCategoryModel.product_category
          )
        })),
        productCategories =>
          pipe(
            maybeCountNewDiscounts,
            O.chain(O.fromPredicate(identity)),
            O.map(() => ({
              items: productCategories
            })),
            O.getOrElseW(() => ({
              items: productCategories.map(pc => pc.productCategory)
            }))
          )
      )
    ),
    TE.chain(
      flow(
        PublishedProductCategoriesResult.decode,
        TE.fromEither,
        TE.mapLeft(errorsToError)
      )
    ),
    TE.bimap(trackErrorToResponseErrorInternal, ResponseSuccessJson),
    TE.toUnion
  )();

export const GetPublishedProductCategories = (
  cgnOperatorDb: Sequelize
): express.RequestHandler => {
  const handler = GetPublishedProductCategoriesHandler(cgnOperatorDb);
  const middlewaresWrap = withRequestMiddlewares(
    OptionalQueryParamMiddleware("count_new_discounts", BooleanFromString)
  );
  return wrapRequestHandler(middlewaresWrap(handler));
};
