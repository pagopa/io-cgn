/**
 * Config module
 *
 * Single point of access for the application confguration. Handles validation on required environment variables.
 * The configuration is evaluate eagerly at the first access to the module. The module exposes convenient methods to access such value.
 */

import {
  IntegerFromString,
  NonNegativeInteger
} from "@pagopa/ts-commons/lib/numbers";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

// global app configuration
export type IConfig = t.TypeOf<typeof IConfig>;
export const IConfig = t.interface({
  isPostgresSslEnabled: t.boolean,
  isProduction: t.boolean,

  // eslint-disable-next-line sort-keys
  ATTRIBUTE_AUTHORITY_POSTGRES_DB_URI: NonEmptyString,
  BLOB_NAME: NonEmptyString,
  CONTAINER_NAME: NonEmptyString,
  STORAGE_CONNECTION_STRING: NonEmptyString,
  // eslint-disable-next-line sort-keys
  SERVER_PORT: NonNegativeInteger
});

// No need to re-evaluate this object for each call
const errorOrConfig: t.Validation<IConfig> = IConfig.decode({
  ...process.env,
  SERVER_PORT: pipe(
    process.env.SERVER_PORT,
    IntegerFromString.decode,
    E.getOrElse(() => -1)
  ),
  isPostgresSslEnabled:
    process.env.ATTRIBUTE_AUTHORITY_POSTGRES_DB_SSL_ENABLED === "true",
  isProduction: process.env.NODE_ENV === "production"
});

/**
 * Read the application configuration and check for invalid values.
 * Configuration is eagerly evalued when the application starts.
 *
 * @returns either the configuration values or a list of validation errors
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function getConfig(): t.Validation<IConfig> {
  return errorOrConfig;
}

/**
 * Read the application configuration and check for invalid values.
 * If the application is not valid, raises an exception.
 *
 * @returns the configuration values
 * @throws validation errors found while parsing the application configuration
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function getConfigOrThrow(): IConfig {
  return pipe(
    errorOrConfig,
    E.getOrElseW(errors => {
      throw new Error(`Invalid configuration: ${readableReport(errors)}`);
    })
  );
}
