import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters.js";
import { Errors } from "io-ts";

export const errorsToError = (errors: Errors): Error =>
  new Error(errorsToReadableMessages(errors).join(" / "));
