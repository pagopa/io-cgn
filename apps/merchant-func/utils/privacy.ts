import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

export const errorObfuscation =
  (stringToObfuscate?: NonEmptyString) =>
  (err: Error): Error => {
    const errorMessage = stringToObfuscate
      ? err.message?.replace(stringToObfuscate, "<secret>")
      : err.message;
    return new Error(errorMessage);
  };
