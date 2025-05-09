/**
 * Config module
 *
 * Single point of access for the application confguration. Handles validation on required environment variables.
 * The configuration is evaluate eagerly at the first access to the module. The module exposes convenient methods to access such value.
 */
/* eslint-disable sort-keys */

import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

// global app configuration
export type IConfig = t.TypeOf<typeof IConfig>;
export const IConfig = t.interface({
  APPINSIGHTS_SAMPLING_PERCENTAGE: NonEmptyString,
  APPLICATIONINSIGHTS_CONNECTION_STRING: NonEmptyString,

  CGN_EXPIRATION_TABLE_NAME: NonEmptyString,

  CGN_STORAGE_CONNECTION_STRING: NonEmptyString,

  COSMOSDB_CGN_DATABASE_NAME: NonEmptyString,
  COSMOSDB_CGN_KEY: NonEmptyString,
  COSMOSDB_CGN_URI: NonEmptyString,

  EYCA_EXPIRATION_TABLE_NAME: NonEmptyString,

  isProduction: t.boolean,
});

// No need to re-evaluate this object for each call
const errorOrConfig: t.Validation<IConfig> = IConfig.decode({
  ...process.env,
  isProduction: process.env.NODE_ENV === "production",
});

/**
 * Read the application configuration and check for invalid values.
 * Configuration is eagerly evalued when the application starts.
 *
 * @returns either the configuration values or a list of validation errors
 */
export const getConfig = (): t.Validation<IConfig> => errorOrConfig;

/**
 * Read the application configuration and check for invalid values.
 * If the application is not valid, raises an exception.
 *
 * @returns the configuration values
 * @throws validation errors found while parsing the application configuration
 */
export const getConfigOrThrow = (): IConfig =>
  pipe(
    errorOrConfig,
    E.getOrElseW((errors) => {
      throw new Error(`Invalid configuration: ${readableReport(errors)}`);
    }),
  );
