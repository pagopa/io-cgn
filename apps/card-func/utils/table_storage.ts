import { DefaultAzureCredential } from "@azure/identity";
import { RestError } from "@azure/data-tables";
import {
  TableClient,
  TableEntityResult,
} from "@azure/data-tables";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as date_fns from "date-fns";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { Timestamp } from "../generated/definitions/Timestamp";

/**
 * A minimal Youth Card storage table Entry
 */
export type TableEntry = Readonly<{
  readonly ActivationDate: Date;
  readonly ExpirationDate: Date;
  readonly rowKey: FiscalCode;
}>;

export type PagedQuery = () => AsyncIterableIterator<readonly TableEntry[]>;

/**
 * Returns a TableClient using managed identity for the given storage account and table.
 */
export const getTableClient = (
  accountName: string,
  tableName: string,
): TableClient =>
  new TableClient(
    `https://${accountName}.table.core.windows.net`,
    tableName,
    new DefaultAzureCredential(),
    { retryOptions: { maxRetries: 5 } },
  );

/**
 * Returns a paged query function that iterates over all entities matching the filter.
 */
export const getPagedQuery =
  (tableClient: TableClient) =>
  (filter: string): PagedQuery =>
    async function* (): AsyncIterableIterator<readonly TableEntry[]> {
      for await (const page of tableClient
        .listEntities<TableEntry>({ queryOptions: { filter } })
        .byPage()) {
        yield page as readonly TableEntry[];
      }
    };

/**
 * Iterates over all pages of entries returned by the provided paged query function.
 *
 * @throws Exception on query failure
 */
export async function* iterateOnPages(
  pagedQuery: PagedQuery,
): AsyncIterableIterator<readonly TableEntry[]> {
  yield* pagedQuery();
}

/**
 * Returns an OData filter expression to select all entries for the provided partition key.
 */
export const queryFilterForKey = (partitionKey: string): string =>
  `PartitionKey eq '${partitionKey}'`;

/**
 * Store a card expiration into `cardExpirationTableName` table
 */
export type StoreCardExpirationFunction = (
  fiscalCode: FiscalCode,
  activationDate: Date,
  expirationDate: Date,
) => TE.TaskEither<Error, void>;

export const insertCardExpiration =
  (tableClient: TableClient): StoreCardExpirationFunction =>
  (
    fiscalCode: FiscalCode,
    activationDate: Date,
    expirationDate: Date,
  ): TE.TaskEither<Error, void> =>
    TE.tryCatch(
      async () => {
        await tableClient.upsertEntity(
          {
            partitionKey: date_fns.format(expirationDate, "yyyy-MM-dd"),
            rowKey: fiscalCode,
            ActivationDate: activationDate,
            ExpirationDate: expirationDate,
          },
          "Replace",
        );
      },
      E.toError,
    );

/**
 * Delete a card expiration from `cardExpirationTableName` table
 */
export type DeleteCardExpirationFunction = (
  fiscalCode: FiscalCode,
  expirationDate: Date,
) => TE.TaskEither<Error, void>;

export const deleteCardExpiration =
  (tableClient: TableClient): DeleteCardExpirationFunction =>
  (
    fiscalCode: FiscalCode,
    expirationDate: Date,
  ): TE.TaskEither<Error, void> =>
    TE.tryCatch(
      async () => {
        try {
          await tableClient.deleteEntity(
            date_fns.format(expirationDate, "yyyy-MM-dd"),
            fiscalCode,
          );
        } catch (e) {
          // 404 is acceptable — entity may not exist
          if (e instanceof RestError && e.statusCode === 404) return;
          throw e;
        }
      },
      E.toError,
    );
