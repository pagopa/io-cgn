/**
 * Use a singleton CosmosDB client across functions.
 */
import { CosmosClient } from "@azure/cosmos";
import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { getConfigOrThrow } from "./config";

const config = getConfigOrThrow();
const cosmosDbUri = config.COSMOSDB_CGN_URI;
const masterKey = config.COSMOSDB_CGN_KEY;

export const cosmosdbClient = new CosmosClient({
  endpoint: cosmosDbUri,
  key: masterKey
});

export const getCosmosHealth: RTE.ReaderTaskEither<
  { cosmosClient: CosmosClient },
  Error,
  true
> = ({ cosmosClient }) =>
  pipe(
    TE.tryCatch(
      () => cosmosClient.getDatabaseAccount(),
      () => new Error("cosmos-db-error"),
    ),
    TE.map(() => true),
  );
