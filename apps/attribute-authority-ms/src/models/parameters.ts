import * as t from "io-ts";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import { WithinRangeString } from "@pagopa/ts-commons/lib/strings";
import { NumberFromString } from "@pagopa/ts-commons/lib/numbers";
import { KeyOrganizationFiscalCode } from "../../generated/definitions/KeyOrganizationFiscalCode";
import { ReferentFiscalCode } from "../../generated/definitions/ReferentFiscalCode";

export const ISortByOrganizations = t.union([
  t.literal("fiscalCode"),
  t.literal("name"),
  t.literal("pec"),
  t.literal("insertedAt")
]);

export type ISortByOrganizations = t.TypeOf<typeof ISortByOrganizations>;

export const ISortDirectionOrganizations = t.union([
  t.literal("ASC"),
  t.literal("DESC")
]);

export type ISortDirectionOrganizations = t.TypeOf<
  typeof ISortDirectionOrganizations
>;

export const IGetOrganizationsQueryString = t.partial({
  page: withDefault(NumberFromString, 0),
  pageSize: withDefault(NumberFromString, 20),
  searchQuery: WithinRangeString(1, 100),
  sortBy: ISortByOrganizations,
  sortDirection: ISortDirectionOrganizations
});

export type IGetOrganizationsQueryString = t.TypeOf<
  typeof IGetOrganizationsQueryString
>;

export const IDeleteReferentPathParams = t.intersection([
  KeyOrganizationFiscalCode,
  ReferentFiscalCode
]);
export type IDeleteReferentPathParams = t.TypeOf<
  typeof IDeleteReferentPathParams
>;
