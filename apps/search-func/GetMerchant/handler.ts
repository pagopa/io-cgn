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
  ResponseErrorNotFound,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { withoutUndefinedValues } from "@pagopa/ts-commons/lib/types";
import * as express from "express";
import * as AP from "fp-ts/lib/Apply";
import * as AR from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { QueryTypes, Sequelize } from "sequelize";

import { Merchant } from "../generated/definitions/Merchant";
import { OptionalHeaderParamMiddleware } from "../middlewares/optional_header_param";
import AddressModel from "../models/AddressModel";
import { DiscountCodeTypeFromModel } from "../models/DiscountCodeTypes";
import DiscountModel from "../models/DiscountModel";
import MerchantProfileModel from "../models/MerchantProfileModel";
import { ProductCategoryFromModel } from "../models/ProductCategories";
import {
  trackErrorToResponseErrorInternal,
  trackErrorsToResponseErrorInternal,
} from "../utils/appinsights";
import {
  SelectDiscountsByMerchantQuery,
  SelectMerchantAddressListQuery,
  SelectMerchantProfileQuery,
} from "../utils/postgres_queries";

type ResponseTypes =
  | IResponseErrorInternal
  | IResponseErrorNotFound
  | IResponseSuccessJson<Merchant>;

type IGetMerchantHandler = (
  context: Context,
  merchantId: string,
  maybeFromExternalHeader: O.Option<NonEmptyString>,
) => Promise<ResponseTypes>;

const addressesTask = (
  cgnOperatorDb: Sequelize,
  profileId: number,
): TE.TaskEither<IResponseErrorInternal, readonly AddressModel[]> =>
  pipe(
    TE.tryCatch(
      () =>
        cgnOperatorDb.query(SelectMerchantAddressListQuery, {
          model: AddressModel,
          raw: true,
          replacements: { profile_key: profileId },
          type: QueryTypes.SELECT,
        }),
      E.toError,
    ),
    TE.mapLeft(trackErrorToResponseErrorInternal),
  );

const discountsTask = (
  cgnOperatorDb: Sequelize,
  merchantId: string,
): TE.TaskEither<IResponseErrorInternal, readonly DiscountModel[]> =>
  pipe(
    TE.tryCatch(
      () =>
        cgnOperatorDb.query(SelectDiscountsByMerchantQuery, {
          model: DiscountModel,
          raw: true,
          replacements: { agreement_key: merchantId },
          type: QueryTypes.SELECT,
        }),
      E.toError,
    ),
    TE.mapLeft(trackErrorToResponseErrorInternal),
  );

const allNationalAddressesArray = [
  {
    full_address: "Tutti i punti vendita sul territorio nazionale",
  },
];

export const GetMerchantHandler =
  (cgnOperatorDb: Sequelize, cdnBaseUrl: string): IGetMerchantHandler =>
  async (_, merchantId, maybeFromExternalHeader): Promise<ResponseTypes> =>
    pipe(
      TE.tryCatch(
        () =>
          cgnOperatorDb.query(SelectMerchantProfileQuery, {
            model: MerchantProfileModel,
            raw: true,
            replacements: { merchant_id: merchantId },
            type: QueryTypes.SELECT,
          }),
        E.toError,
      ),
      TE.bimap(trackErrorToResponseErrorInternal, AR.head),
      TE.chainW(
        TE.fromOption(() =>
          ResponseErrorNotFound("Not Found", "Merchant profile not found"),
        ),
      ),
      TE.chainW((merchant) =>
        pipe(
          {
            addresses: addressesTask(cgnOperatorDb, merchant.profile_k),
            discounts: discountsTask(cgnOperatorDb, merchantId),
          },
          AP.sequenceS(TE.ApplicativePar),
          TE.map(({ addresses, discounts }) => ({
            addresses:
              addresses.length === 0 && merchant.all_national_addresses
                ? allNationalAddressesArray
                : addresses.map((a) =>
                    withoutUndefinedValues({
                      full_address: a.full_address,
                      latitude: pipe(O.fromNullable(a.latitude), O.toUndefined),
                      longitude: pipe(
                        O.fromNullable(a.longitude),
                        O.toUndefined,
                      ),
                    }),
                  ),
            discounts: discounts.map((d) =>
              withoutUndefinedValues({
                condition: pipe(O.fromNullable(d.condition), O.toUndefined),
                description: pipe(O.fromNullable(d.description), O.toUndefined),
                discount: pipe(O.fromNullable(d.discount_value), O.toUndefined),
                discountUrl: pipe(
                  O.fromNullable(d.discount_url),
                  O.toUndefined,
                ),
                endDate: d.end_date,
                id: d.discount_k,
                isNew: d.is_new,
                landingPageReferrer: pipe(
                  maybeFromExternalHeader,
                  O.fold(
                    () =>
                      pipe(
                        d.landing_page_url,
                        O.fromNullable,
                        O.chain(() =>
                          pipe(
                            d.landing_page_referrer,
                            O.fromNullable,
                            O.fold(() => O.some("-"), O.some),
                          ),
                        ),
                        O.toUndefined,
                      ),
                    () => undefined,
                  ),
                ),
                landingPageUrl: pipe(
                  maybeFromExternalHeader,
                  O.fold(
                    () =>
                      pipe(d.landing_page_url, O.fromNullable, O.toUndefined),
                    () => undefined,
                  ),
                ),
                name: d.name,
                productCategories: d.product_categories.map((p) =>
                  ProductCategoryFromModel(p),
                ),
                startDate: d.start_date,
                staticCode: pipe(
                  maybeFromExternalHeader,
                  O.fold(
                    () => pipe(d.static_code, O.fromNullable, O.toUndefined),
                    () => undefined,
                  ),
                ),
              }),
            ),
            merchant,
          })),
        ),
      ),
      TE.map(({ addresses, discounts, merchant }) =>
        withoutUndefinedValues({
          addresses,
          allNationalAddresses: merchant.all_national_addresses,
          description: merchant.description,
          discountCodeType: pipe(
            O.fromNullable(merchant.discount_code_type),
            O.map(DiscountCodeTypeFromModel),
            O.toUndefined,
          ),
          discounts,
          fullName: merchant.full_name,
          id: merchant.agreement_fk,
          imageUrl: `${cdnBaseUrl}/${merchant.image_url}`,
          name: merchant.name,
          websiteUrl: pipe(O.fromNullable(merchant.website_url), O.toUndefined),
        }),
      ),
      TE.chainW(
        flow(
          Merchant.decode,
          TE.fromEither,
          TE.bimap(trackErrorsToResponseErrorInternal, ResponseSuccessJson),
        ),
      ),
      TE.toUnion,
    )();

export const GetMerchant = (
  cgnOperatorDb: Sequelize,
  cdnBaseUrl: NonEmptyString,
  fromExternalHeaderName: NonEmptyString,
): express.RequestHandler => {
  const handler = GetMerchantHandler(cgnOperatorDb, cdnBaseUrl);

  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredParamMiddleware("merchantId", NonEmptyString),
    OptionalHeaderParamMiddleware(fromExternalHeaderName, NonEmptyString),
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
