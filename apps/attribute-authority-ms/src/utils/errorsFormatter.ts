import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { ProblemJson } from "@pagopa/ts-commons/lib/responses";
import { Errors } from "io-ts";

/**
 * Merge into one single Error several errors provided in input and add a context description
 *
 * @param errors
 * @param context
 * @returns A single Error instance with a formatted message.
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function multipleErrorsFormatter(
  errors: ReadonlyArray<Error>,
  context: string
): Error {
  return new Error(
    errors.map(_ => `value [${_.message}]`).join(` at [context: ${context}]\n`)
  );
}

export const errorsToError = (errors: Errors): Error =>
  new Error(errorsToReadableMessages(errors).join(" / "));

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const readableProblem = (problem: ProblemJson) =>
  `${problem.title} (${problem.type || "no problem type specified"})`;
