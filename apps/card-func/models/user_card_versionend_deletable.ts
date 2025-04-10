import { Container, ItemDefinition, SqlQuerySpec } from "@azure/cosmos";
import {
  asyncIteratorToArray,
  flattenAsyncIterator,
} from "@pagopa/io-functions-commons/dist/src/utils/async";
import {
  CosmosdbModelVersioned,
  RetrievedVersionedModel,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model_versioned";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as AR from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

export abstract class UserCardVersionedDeletable<
  T,
  TN extends Readonly<T>,
  TR extends Readonly<RetrievedVersionedModel & T>,
  ModelIdKey extends keyof T,
  PartitionKey extends keyof T = ModelIdKey,
> extends CosmosdbModelVersioned<T, TN, TR, ModelIdKey, PartitionKey> {
  private readonly createGetAllCardQuery = (
    fiscalCode: FiscalCode,
    cardPkField: NonEmptyString | string,
  ): SqlQuerySpec => ({
    parameters: [
      {
        name: "@fiscalCode",
        value: fiscalCode,
      },
    ],
    query: `SELECT * FROM c WHERE c.${cardPkField} = @fiscalCode`,
  });
  public deleteVersion = (
    fiscalCode: FiscalCode,
    documentId: NonEmptyString,
  ): TE.TaskEither<Error, string> =>
    pipe(
      TE.tryCatch(
        () => this.container.item(documentId, fiscalCode).delete(),
        E.toError,
      ),
      TE.map((_) => _.item.id),
    );

  protected findAll = (
    fiscalCode: FiscalCode,
    cardPkField: NonEmptyString | string,
  ): TE.TaskEither<Error, readonly TR[]> =>
    pipe(
      this.createGetAllCardQuery(fiscalCode, cardPkField),
      (querySpec) => this.getQueryIterator(querySpec)[Symbol.asyncIterator](),
      flattenAsyncIterator,
      (queryIterator) =>
        TE.tryCatch(() => asyncIteratorToArray(queryIterator), E.toError),
      TE.map((_) => Array.from(_)),
      TE.map(AR.rights),
    );

  // eslint-disable-next-line
  constructor(
    container: Container,
    newVersionedItemT: t.Type<TN, ItemDefinition, unknown>,
    retrievedItemT: t.Type<TR, unknown, unknown>,
    modelIdKey: ModelIdKey,
    partitionKey?: PartitionKey | undefined,
  ) {
    super(
      container,
      newVersionedItemT,
      retrievedItemT,
      modelIdKey,
      partitionKey,
    );
  }
}
