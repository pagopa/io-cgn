import * as AR from "fp-ts/lib/Array";
import { identity, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { Op, QueryTypes } from "sequelize";
import { NumberFromString } from "@pagopa/ts-commons/lib/numbers";
import { Organizations } from "../../generated/definitions/Organizations";
import { OrganizationWithReferents } from "../../generated/definitions/OrganizationWithReferents";
import {
  Organization as OrganizationModel,
  Referent
} from "../models/dbModels";
import { UpdateOrganizationPrimaryKey } from "../utils/postgres_queries";
import {
  ISortByOrganizations,
  ISortDirectionOrganizations
} from "../models/parameters";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const filterByNameOrFiscalCode = (searchQuery?: string) =>
  pipe(
    O.fromNullable(searchQuery),
    // eslint-disable-next-line @typescript-eslint/no-shadow
    O.map(searchQuery => ({
      where: {
        [Op.or]: [
          { fiscal_code: { [Op.iLike]: `%${searchQuery}%` } },
          { name: { [Op.iLike]: `%${searchQuery}%` } },
          {
            referents: {
              some: {
                fiscal_code: { [Op.iLike]: `%${searchQuery}%` }
              }
            }
          }
        ]
      }
    })),
    O.getOrElse(() => ({}))
  );

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const paging = (page?: NumberFromString, pageSize?: NumberFromString) =>
  pipe(
    O.Do,
    O.bind("page", () => O.fromNullable(page)),
    O.bind("pageSize", () => O.fromNullable(pageSize)),
    // eslint-disable-next-line @typescript-eslint/no-shadow
    O.map(({ page, pageSize }) => ({
      offset: page * pageSize,
      // eslint-disable-next-line sort-keys
      limit: pageSize
    })),
    O.getOrElse(() => ({}))
  );

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const ordering = (
  by?: ISortByOrganizations,
  direction?: ISortDirectionOrganizations
) =>
  pipe(
    O.Do,
    O.bind("by", () => O.fromNullable(by)),
    O.bind("order", () => O.fromNullable(direction)),
    // eslint-disable-next-line @typescript-eslint/no-shadow
    O.map(({ by, order }) => ({
      order: [[by, order]]
    })),
    O.getOrElse(() => ({}))
  );

export const getOrganizations = (
  page?: NumberFromString,
  pageSize?: NumberFromString,
  searchQuery?: string,
  sortBy?: ISortByOrganizations,
  sortDirection?: ISortDirectionOrganizations
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
            ...ordering(sortBy, sortDirection)
          }),
        E.toError
      )
    ),
    TE.bind("count", () =>
      TE.tryCatch(
        () =>
          OrganizationModel.count({
            include: [OrganizationModel.associations.referents],
            ...filterByNameOrFiscalCode(searchQuery),
            ...paging(page, pageSize),
            ...ordering(sortBy, sortDirection)
          }),
        E.toError
      )
    ),
    TE.map(({ organizations, count }) =>
      pipe(
        organizations,
        AR.map(m => ({
          keyOrganizationFiscalCode: m.fiscalCode,
          organizationFiscalCode: m.fiscalCode,
          organizationName: m.name,
          pec: m.pec,
          // eslint-disable-next-line sort-keys
          insertedAt: m.insertedAt,
          referents: m.referents.map(r => r.fiscalCode)
        })),
        items => ({
          items,
          // eslint-disable-next-line sort-keys
          count
        }),
        Organizations.decode,
        E.bimap(_ => E.toError("Cannot decode response"), identity),
        E.toUnion
      )
    )
  );

export const upsertOrganization = (
  organizationWithReferents: OrganizationWithReferents
): TE.TaskEither<Error, OrganizationWithReferents> =>
  pipe(
    TE.tryCatch(async () => {
      if (
        organizationWithReferents.keyOrganizationFiscalCode !==
        organizationWithReferents.organizationFiscalCode
      ) {
        await OrganizationModel.sequelize!.query(UpdateOrganizationPrimaryKey, {
          raw: true,
          replacements: {
            new_fiscal_code: organizationWithReferents.organizationFiscalCode,
            old_fiscal_code: organizationWithReferents.keyOrganizationFiscalCode
          },
          type: QueryTypes.UPDATE
        });
      }
    }, E.toError),
    TE.chain(() =>
      TE.tryCatch(
        () =>
          OrganizationModel.upsert({
            fiscalCode: organizationWithReferents.organizationFiscalCode,
            name: organizationWithReferents.organizationName,
            pec: organizationWithReferents.pec
          }),
        E.toError
      )
    ),
    TE.chain(([organization, _]) =>
      pipe(
        TE.tryCatch(() => organization.getReferents(), E.toError),
        TE.chain(referentsToRemove =>
          TE.tryCatch(
            () =>
              organization.removeReferents(referentsToRemove, {
                force: true
              }),
            E.toError
          )
        ),
        TE.chain(() =>
          TE.sequenceArray(
            organizationWithReferents.referents.map(r =>
              TE.tryCatch(() => Referent.upsert({ fiscalCode: r }), E.toError)
            )
          )
        ),
        TE.map(r => r.map(e => e[0])),
        TE.chain(referents =>
          TE.tryCatch(
            () =>
              organization.addReferents(referents, {
                ignoreDuplicates: true
              }),
            E.toError
          )
        ),
        TE.chain(() =>
          pipe(
            OrganizationWithReferents.decode({
              keyOrganizationFiscalCode: organization.fiscalCode,
              organizationFiscalCode: organization.fiscalCode,
              organizationName: organization.name,
              pec: organization.pec,
              // eslint-disable-next-line sort-keys
              insertedAt: organization.insertedAt,
              referents: organizationWithReferents.referents
            }),
            E.mapLeft(E.toError),
            TE.fromEither
          )
        )
      )
    )
  );

export const getOrganization = (
  keyOrganizationFiscalCode: string
): TE.TaskEither<Error, O.Option<OrganizationWithReferents>> =>
  pipe(
    TE.tryCatch(
      () =>
        OrganizationModel.findByPk(keyOrganizationFiscalCode, {
          include: [OrganizationModel.associations.referents]
        }),
      E.toError
    ),
    TE.map(maybeOrganizationModel =>
      pipe(
        O.fromNullable(maybeOrganizationModel),
        O.chain(org =>
          pipe(
            OrganizationWithReferents.decode({
              keyOrganizationFiscalCode: org.fiscalCode,
              organizationFiscalCode: org.fiscalCode,
              organizationName: org.name,
              pec: org.pec,
              // eslint-disable-next-line sort-keys
              insertedAt: org.insertedAt,
              referents: org.referents.map(r => r.fiscalCode)
            }),
            O.fromPredicate(E.isRight),
            O.map(o => o.right)
          )
        )
      )
    )
  );

export const deleteOrganization = (
  keyOrganizationFiscalCode: string
): TE.TaskEither<Error, O.Option<Promise<void>>> =>
  pipe(
    TE.tryCatch(
      // eslint-disable-next-line sonarjs/no-identical-functions
      () =>
        OrganizationModel.findByPk(keyOrganizationFiscalCode, {
          include: [OrganizationModel.associations.referents]
        }),
      E.toError
    ),
    TE.map(O.fromNullable),
    TE.chain(organizationModelOption =>
      TE.tryCatch(
        async () =>
          pipe(
            organizationModelOption,
            O.map(org => org.destroy({ force: true }))
          ),
        E.toError
      )
    )
  );
