import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { IConfig, getConfig } from "./config";

type ProblemSource = "AzureCosmosDB" | "AzureStorage" | "Config" | "Url";
export type HealthProblem<S extends ProblemSource> = {
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

/**
 * Check application's configuration is correct
 *
 * @returns either true or an array of error messages
 */
export const checkConfigHealth = (): HealthCheck<"Config", IConfig> =>
  pipe(
    getConfig(),
    TE.fromEither,
    TE.mapLeft((errors) =>
      errors.map((e) =>
        // give each problem its own line
        formatProblem("Config", readableReport([e])),
      ),
    ),
  );

/**
 * Execute all the health checks for the application
 *
 * @returns either true or an array of error messages
 */
export const checkApplicationHealth = (): HealthCheck<ProblemSource, true> =>
  pipe(
    void 0,
    TE.of,
    TE.chain(() => checkConfigHealth()),
    TE.map(() => true),
  );
