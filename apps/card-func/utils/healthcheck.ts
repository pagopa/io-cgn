import { QueueServiceClient } from "@azure/storage-queue";
import { TableServiceClient } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";
import { CosmosClient } from "@azure/cosmos";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { sequenceT } from "fp-ts/lib/Apply";
import * as A from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import fetch from "node-fetch";

import { getRedisClientFactory } from "../utils/redis";
import { IConfig, getConfig } from "./config";

type ProblemSource =
  | "AzureCosmosDB"
  | "AzureStorage"
  | "Config"
  | "RedisConnection"
  | "Url";
export type HealthProblem<S extends ProblemSource> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly __source: S;
} & string;
export type HealthCheck<
  S extends ProblemSource = ProblemSource,
  True = true,
> = TE.TaskEither<readonly HealthProblem<S>[], True>;

// format and cast a problem message with its source
const formatProblem = <S extends ProblemSource>(
  source: S,
  message: string,
): HealthProblem<S> => `${source}|${message}` as HealthProblem<S>;

// utility to format an unknown error to an arry of HealthProblem
const toHealthProblems =
  <S extends ProblemSource>(source: S) =>
  (e: unknown): readonly HealthProblem<S>[] => [
    formatProblem(source, E.toError(e).message),
  ];

/**
 * Check application's configuration is correct
 *
 * @returns either true or an array of error messages
 */
export const checkConfigHealth = (): HealthCheck<"Config", IConfig> =>
  pipe(
    TE.fromEither(getConfig()),
    TE.mapLeft((errors) =>
      errors.map((e) =>
        // give each problem its own line
        formatProblem("Config", readableReport([e])),
      ),
    ),
  );

/**
 * Return a CosmosClient
 */
export const buildCosmosClient = (
  dbUri: string,
  dbKey?: string,
): CosmosClient =>
  new CosmosClient({
    endpoint: dbUri,
    key: dbKey,
  });

/**
 * Check the application can connect to an Azure CosmosDb instances
 *
 * @param dbUri uri of the database
 * @param dbUri connection string for the storage
 *
 * @returns either true or an array of error messages
 */
export const checkAzureCosmosDbHealth = (
  dbUri: string,
  dbKey?: string,
): HealthCheck<"AzureCosmosDB", true> =>
  pipe(
    TE.tryCatch(async () => {
      const client = buildCosmosClient(dbUri, dbKey);
      return client.getDatabaseAccount();
    }, toHealthProblems("AzureCosmosDB")),
    TE.map(() => true),
  );

/**
 * Check the application can connect to Azure Storage using identity-based access.
 *
 * @param accountName storage account name
 *
 * @returns either true or an array of error messages
 */
export const checkAzureStorageHealth = (
  accountName: string,
): HealthCheck<"AzureStorage"> => {
  const credential = new DefaultAzureCredential();
  const applicativeValidation = TE.getApplicativeTaskValidation(
    T.ApplicativePar,
    RA.getSemigroup<HealthProblem<"AzureStorage">>(),
  );

  const checkQueue = TE.tryCatch(async () => {
    const client = new QueueServiceClient(
      `https://${accountName}.queue.core.windows.net`,
      credential,
    );
    await client.getProperties();
  }, toHealthProblems("AzureStorage"));

  const checkTable = TE.tryCatch(async () => {
    const client = new TableServiceClient(
      `https://${accountName}.table.core.windows.net`,
      credential,
    );
    // list one table to verify connectivity
    for await (const _ of client.listTables()) {
      break;
    }
  }, toHealthProblems("AzureStorage"));

  return pipe(
    sequenceT(applicativeValidation)(checkQueue, checkTable),
    TE.map(() => true),
  );
};

/**
 * Check a url is reachable
 *
 * @param url url to connect with
 *
 * @returns either true or an array of error messages
 */
export const checkUrlHealth = (url: string): HealthCheck<"Url", true> =>
  pipe(
    TE.tryCatch(() => fetch(url, { method: "HEAD" }), toHealthProblems("Url")),
    TE.map(() => true),
  );

/**
 * Check redis connection is available
 */
export const checkRedisConnection = (
  config: IConfig,
): HealthCheck<"RedisConnection", true> =>
  pipe(
    TE.tryCatch(
      () => getRedisClientFactory(config).getInstance(),
      toHealthProblems("RedisConnection"),
    ),
    TE.map(() => true),
  );

/**
 * Execute all the health checks for the application
 *
 * @returns either true or an array of error messages
 */
export const checkApplicationHealth = (): HealthCheck<ProblemSource, true> => {
  const applicativeValidation = TE.getApplicativeTaskValidation(
    T.ApplicativePar,
    RA.getSemigroup<HealthProblem<ProblemSource>>(),
  );

  return pipe(
    void 0,
    TE.of,
    TE.chain(() => checkConfigHealth()),
    TE.chain((config) =>
      // run each taskEither and collect validation errors from each one of them, if any
      sequenceT(applicativeValidation)(
        checkAzureStorageHealth(config.CGN_STORAGE_ACCOUNT_NAME),
        checkRedisConnection(config),
      ),
    ),
    TE.map(() => true),
  );
};
