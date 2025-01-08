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
import { withoutUndefinedValues } from "@pagopa/ts-commons/lib/types";
import * as express from "express";
import * as AR from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, identity, pipe } from "fp-ts/lib/function";
import { toLowerCase } from "fp-ts/lib/string";
import { QueryTypes, Sequelize } from "sequelize";

import { OnlineMerchantSearchRequest } from "../generated/definitions/OnlineMerchantSearchRequest";
import { OnlineMerchants } from "../generated/definitions/OnlineMerchants";
import { DiscountCodeTypeFromModel } from "../models/DiscountCodeTypes";
import OnlineMerchantModel from "../models/OnlineMerchantModel";
import { ProductCategoryFromModel } from "../models/ProductCategories";
import { trackErrorToResponseErrorInternal } from "../utils/appinsights";
import { errorsToError } from "../utils/conversions";
import { selectOnlineMerchantsQuery } from "../utils/postgres_queries";

type ResponseTypes =
  | IResponseErrorInternal
  | IResponseSuccessJson<OnlineMerchants>;

type IGetOnlineMerchantsHandler = (
  context: Context,
  searchRequest: OnlineMerchantSearchRequest,
) => Promise<ResponseTypes>;

export const GetOnlineMerchantsHandler =
  (cgnOperatorDb: Sequelize): IGetOnlineMerchantsHandler =>
  async (_, searchRequest): Promise<ResponseTypes> =>
    pipe(
      TE.tryCatch(
        () =>
          cgnOperatorDb.query(
            selectOnlineMerchantsQuery(
              O.fromNullable(searchRequest.merchantName),
              O.fromNullable(searchRequest.productCategories),
              O.fromNullable(searchRequest.page),
              O.fromNullable(searchRequest.pageSize),
            ),
            {
              model: OnlineMerchantModel,
              raw: true,
              replacements: {
                name_filter: `%${pipe(
                  O.fromNullable(searchRequest.merchantName),
                  O.fold(() => "", identity),
                  toLowerCase,
                )}%`,
              },
              type: QueryTypes.SELECT,
            },
          ),
        E.toError,
      ),
      TE.map(
        flow(
          AR.map((onlineMerchant) =>
            withoutUndefinedValues({
              ...onlineMerchant,
              discountCodeType: DiscountCodeTypeFromModel(
                onlineMerchant.discount_code_type,
              ),
              newDiscounts:
                onlineMerchant.new_discounts &&
                pipe(
                  O.fromNullable(searchRequest.productCategories),
                  O.map((filter_categories) =>
                    pipe(
                      O.fromNullable(
                        onlineMerchant.categories_with_new_discounts,
                      ),
                      O.map(
                        (categories_with_new_discounts) =>
                          categories_with_new_discounts.filter((v) =>
                            filter_categories.includes(
                              ProductCategoryFromModel(v),
                            ),
                          ).length > 0,
                      ),
                      O.getOrElse(() => false), // there are no categories with new discounts
                    ),
                  ),
                  O.getOrElse(() => true), // no category filter => maintain the queried flag
                ),
              numberOfNewDiscounts:
                onlineMerchant.number_of_new_discounts ?? undefined,
              productCategories: pipe(
                [...onlineMerchant.product_categories],
                AR.map(ProductCategoryFromModel),
              ),
              websiteUrl: onlineMerchant.website_url,
            }),
          ),
          (onlineMerchants) => ({ items: onlineMerchants }),
        ),
      ),
      TE.chain(
        flow(OnlineMerchants.decode, TE.fromEither, TE.mapLeft(errorsToError)),
      ),
      TE.bimap(trackErrorToResponseErrorInternal, ResponseSuccessJson),
      TE.toUnion,
    )();

export const GetOnlineMerchants = (
  cgnOperatorDb: Sequelize,
): express.RequestHandler => {
  const handler = GetOnlineMerchantsHandler(cgnOperatorDb);

  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredBodyPayloadMiddleware(OnlineMerchantSearchRequest),
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
