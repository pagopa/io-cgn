import { IntegerFromString } from "@pagopa/ts-commons/lib/numbers";
import { ResponseErrorInternal } from "@pagopa/ts-commons/lib/responses";
import * as ai from "applicationinsights";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import { Errors } from "io-ts";
import { errorsToError } from "./conversions";

const samplingPercentage = pipe(
  process.env["APPINSIGHTS_SAMPLING_PERCENTAGE"],
  IntegerFromString.decode,
  E.getOrElse(_ => 5)
);

/** TelemetryClient singleton */
let telemetryClient: ai.TelemetryClient;

/**
 * Sets a given telemetry client
 * Useful for testing purposes
 * @param tc a given, or mocked, telemetry client
 */
export const setTelemetryClient = (tc: ai.TelemetryClient) => {
  telemetryClient = tc;
};

/**
 * Initialize a singleton with a telemetry client
 */
export const initTelemetryClient = () => {
  if (!telemetryClient) {
    ai.setup().start();
    telemetryClient = ai.defaultClient;
    telemetryClient.config.samplingPercentage = samplingPercentage;
  }
};

/**
 * Track an event and returns void
 * @param name
 * @param additionalProperties
 */
export const trackEventToVoid = (
  name: string,
  additionalProperties: Record<string, string> = {}
) => {
  telemetryClient.trackEvent({
    name: name,
    properties: additionalProperties
  });
};

/**
 * Track an error and returns void
 * @param error
 * @param additionalProperties
 */
export const trackErrorToVoid = (
  error: Error,
  additionalProperties: Record<string, string> = {}
): void => {
  telemetryClient.trackException({
    exception: error,
    properties: additionalProperties
  });
};

/**
 * Track an error and returns the error
 * @param error
 * @param additionalProperties
 */
export const trackErrorToError = (
  error: Error,
  additionalProperties: Record<string, string> = {}
) => {
  trackErrorToVoid(error, additionalProperties);
  return error;
};

/**
 * Track an error and returns a ResponseErrorInternal
 * @param error
 * @param additionalProperties
 */
export const trackErrorToResponseErrorInternal = (
  error: Error,
  additionalProperties: Record<string, string> = {}
) => {
  trackErrorToVoid(error, additionalProperties);
  return ResponseErrorInternal(error.message);
};

/**
 * Track some errors and returns a ResponseErrorInternal
 * @param errors
 * @param additionalProperties
 */
export const trackErrorsToResponseErrorInternal = (
  errors: Errors,
  additionalProperties: Record<string, string> = {}
) => {
  const error = errorsToError(errors);
  trackErrorToVoid(error, additionalProperties);
  return ResponseErrorInternal(error.message);
};

export default initTelemetryClient;
