import { NumberFromString } from "@pagopa/ts-commons/lib/numbers";
import * as AR from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { identity, pipe } from "fp-ts/lib/function";
import { Op, QueryTypes } from "sequelize";

import { OrganizationWithReferents } from "../../generated/definitions/OrganizationWithReferents";
import { Organizations } from "../../generated/definitions/Organizations";
import {
  Organization as OrganizationModel,
  Referent,
} from "../models/dbModels";
import {
  ISortByOrganizations,
  ISortDirectionOrganizations,
} from "../models/parameters";
import { UpdateOrganizationPrimaryKey } from "../utils/postgres_queries";

const filterByNameOrFiscalCode = (searchQuery?: string) =>
  pipe(
    O.fromNullable(searchQuery),

    O.map((searchQuery) => ({
      where: {
        [Op.or]: [
          { fiscal_code: { [Op.iLike]: `%${searchQuery}%` } },
          { name: { [Op.iLike]: `%${searchQuery}%` } },
          {
            referents: {
              some: {
                fiscal_code: { [Op.iLike]: `%${searchQuery}%` },
              },
            },
          },
        ],
      },
    })),
    O.getOrElse(() => ({})),
  );

const paging = (page?: NumberFromString, pageSize?: NumberFromString) =>
  pipe(
    O.Do,
    O.bind("page", () => O.fromNullable(page)),
    O.bind("pageSize", () => O.fromNullable(pageSize)),

    O.map(({ page, pageSize }) => ({
      limit: pageSize,
      offset: page * pageSize,
    })),
    O.getOrElse(() => ({})),
  );

const ordering = (
  by?: ISortByOrganizations,
  direction?: ISortDirectionOrganizations,
) =>
  pipe(
    O.Do,
    O.bind("by", () => O.fromNullable(by)),
    O.bind("order", () => O.fromNullable(direction)),

    O.map(({ by, order }) => ({
      order: [[by, order]],
    })),
    O.getOrElse(() => ({})),
  );

export const getOrganizations = (
  page?: NumberFromString,
  pageSize?: NumberFromString,
  searchQuery?: string,
  sortBy?: ISortByOrganizations,
  sortDirection?: ISortDirectionOrganizations,
): TE.TaskEither<Error, Organizations> =>
  pipe(
    TE.Do,
    TE.bind("organizations", () =>
      TE.tryCatch(
        () =>
          OrganizationModel.findAll({
            include: [OrganizationModel.associations.referents],
            ...filterByNameOrFiscalCode(searchQuery),
            ...paging(page, pageSize),
            ...ordering(sortBy, sortDirection),
          }),
        E.toError,
      ),
    ),
    TE.bind("count", () =>
      TE.tryCatch(
        () =>
          OrganizationModel.count({
            include: [OrganizationModel.associations.referents],
            ...filterByNameOrFiscalCode(searchQuery),
            ...paging(page, pageSize),
            ...ordering(sortBy, sortDirection),
          }),
        E.toError,
      ),
    ),
    TE.map(({ count, organizations }) =>
      pipe(
        organizations,
        AR.map((m) => ({
          insertedAt: m.insertedAt,
          keyOrganizationFiscalCode: m.fiscalCode,
          organizationFiscalCode: m.fiscalCode,
          organizationName: m.name,
          pec: m.pec,
          referents: m.referents.map((r) => r.fiscalCode),
        })),
        (items) => ({
          count,
          items,
        }),
        Organizations.decode,
        E.bimap(() => E.toError("Cannot decode response"), identity),
        E.toUnion,
      ),
    ),
  );

export const upsertOrganization = (
  organizationWithReferents: OrganizationWithReferents,
): TE.TaskEither<Error, OrganizationWithReferents> =>
  pipe(
    TE.tryCatch(async () => {
      if (
        organizationWithReferents.keyOrganizationFiscalCode !==
        organizationWithReferents.organizationFiscalCode
      ) {
        // eslint-disable-next-line
        await OrganizationModel.sequelize!.query(UpdateOrganizationPrimaryKey, {
          raw: true,
          replacements: {
            new_fiscal_code: organizationWithReferents.organizationFiscalCode,
            old_fiscal_code:
              organizationWithReferents.keyOrganizationFiscalCode,
          },
          type: QueryTypes.UPDATE,
        });
      }
    }, E.toError),
    TE.chain(() =>
      TE.tryCatch(
        () =>
          OrganizationModel.upsert({
            fiscalCode: organizationWithReferents.organizationFiscalCode,
            name: organizationWithReferents.organizationName,
            pec: organizationWithReferents.pec,
          }),
        E.toError,
      ),
    ),
    // eslint-disable-next-line
    TE.chain(([organization, _]) =>
      pipe(
        TE.tryCatch(() => organization.getReferents(), E.toError),
        TE.chain((referentsToRemove) =>
          TE.tryCatch(
            () =>
              organization.removeReferents(referentsToRemove, {
                force: true,
              }),
            E.toError,
          ),
        ),
        TE.chain(() =>
          TE.sequenceArray(
            organizationWithReferents.referents.map((r) =>
              TE.tryCatch(() => Referent.upsert({ fiscalCode: r }), E.toError),
            ),
          ),
        ),
        TE.map((r) => r.map((e) => e[0])),
        TE.chain((referents) =>
          TE.tryCatch(
            () =>
              organization.addReferents(referents, {
                ignoreDuplicates: true,
              }),
            E.toError,
          ),
        ),
        TE.chain(() =>
          pipe(
            OrganizationWithReferents.decode({
              insertedAt: organization.insertedAt,
              keyOrganizationFiscalCode: organization.fiscalCode,
              organizationFiscalCode: organization.fiscalCode,
              organizationName: organization.name,
              pec: organization.pec,
              referents: organizationWithReferents.referents,
            }),
            E.mapLeft(E.toError),
            TE.fromEither,
          ),
        ),
      ),
    ),
  );

export const getOrganization = (
  keyOrganizationFiscalCode: string,
): TE.TaskEither<Error, O.Option<OrganizationWithReferents>> =>
  pipe(
    TE.tryCatch(
      () =>
        OrganizationModel.findByPk(keyOrganizationFiscalCode, {
          include: [OrganizationModel.associations.referents],
        }),
      E.toError,
    ),
    TE.map((maybeOrganizationModel) =>
      pipe(
        O.fromNullable(maybeOrganizationModel),
        O.chain((org) =>
          pipe(
            OrganizationWithReferents.decode({
              insertedAt: org.insertedAt,
              keyOrganizationFiscalCode: org.fiscalCode,
              organizationFiscalCode: org.fiscalCode,
              organizationName: org.name,
              pec: org.pec,
              referents: org.referents.map((r) => r.fiscalCode),
            }),
            O.fromPredicate(E.isRight),
            O.map((o) => o.right),
          ),
        ),
      ),
    ),
  );

export const deleteOrganization = (
  keyOrganizationFiscalCode: string,
): TE.TaskEither<Error, O.Option<Promise<void>>> =>
  pipe(
    TE.tryCatch(
      () =>
        OrganizationModel.findByPk(keyOrganizationFiscalCode, {
          include: [OrganizationModel.associations.referents],
        }),
      E.toError,
    ),
    TE.map(O.fromNullable),
    TE.chain((organizationModelOption) =>
      TE.tryCatch(
        async () =>
          pipe(
            organizationModelOption,
            O.map((org) => org.destroy({ force: true })),
          ),
        E.toError,
      ),
    ),
  );
