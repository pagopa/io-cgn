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

import { OfflineMerchantSearchRequest } from "../generated/definitions/OfflineMerchantSearchRequest";
import { OfflineMerchants } from "../generated/definitions/OfflineMerchants";
import OfflineMerchantModel from "../models/OfflineMerchantModel";
import { ProductCategoryFromModel } from "../models/ProductCategories";
import { trackErrorToResponseErrorInternal } from "../utils/appinsights";
import { errorsToError } from "../utils/conversions";
import { selectOfflineMerchantsQuery } from "../utils/postgres_queries";

type ResponseTypes =
  | IResponseErrorInternal
  | IResponseSuccessJson<OfflineMerchants>;

type IGetOfflineMerchantsHandler = (
  context: Context,
  searchRequest: OfflineMerchantSearchRequest,
) => Promise<ResponseTypes>;

export const GetOfflineMerchantsHandler =
  (cgnOperatorDb: Sequelize): IGetOfflineMerchantsHandler =>
  async (ctx, searchRequest): Promise<ResponseTypes> =>
    pipe(
      TE.tryCatch(
        () =>
          cgnOperatorDb.query(selectOfflineMerchantsQuery(searchRequest), {
            model: OfflineMerchantModel,
            raw: true,
            replacements: {
              name_filter: `%${pipe(
                O.fromNullable(searchRequest.merchantName),
                O.fold(() => "", identity),
                toLowerCase,
              )}%`,
            },
            type: QueryTypes.SELECT,
          }),
        E.toError,
      ),
      TE.map(
        flow(
          AR.map((offlineMerchant) =>
            withoutUndefinedValues({
              ...offlineMerchant,
              address: withoutUndefinedValues({
                full_address: offlineMerchant.address,
                latitude: pipe(
                  O.fromNullable(offlineMerchant.latitude),
                  O.toUndefined,
                ),
                longitude: pipe(
                  O.fromNullable(offlineMerchant.longitude),
                  O.toUndefined,
                ),
              }),
              distance: pipe(
                O.fromNullable(offlineMerchant.distance),
                O.map(Math.round),
                O.toUndefined,
              ),
              newDiscounts:
                offlineMerchant.new_discounts &&
                pipe(
                  O.fromNullable(searchRequest.productCategories),
                  O.map((filter_categories) =>
                    pipe(
                      O.fromNullable(
                        offlineMerchant.categories_with_new_discounts,
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
                offlineMerchant.number_of_new_discounts ?? undefined,
              productCategories: offlineMerchant.product_categories.map((pc) =>
                ProductCategoryFromModel(pc),
              ),
            }),
          ),
          (offlineMerchants) => ({ items: offlineMerchants }),
        ),
      ),
      TE.chainW(
        flow(OfflineMerchants.decode, TE.fromEither, TE.mapLeft(errorsToError)),
      ),
      TE.bimap(trackErrorToResponseErrorInternal, ResponseSuccessJson),
      TE.toUnion,
    )();

export const GetOfflineMerchants = (
  cgnOperatorDb: Sequelize,
): express.RequestHandler => {
  const handler = GetOfflineMerchantsHandler(cgnOperatorDb);

  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredBodyPayloadMiddleware(OfflineMerchantSearchRequest),
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
