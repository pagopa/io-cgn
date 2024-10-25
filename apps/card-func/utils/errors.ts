import { Context } from "@azure/functions";
import { trackException } from "./appinsights";
import { IResponse } from "@pagopa/ts-commons/lib/responses";
import { pipe } from "fp-ts/lib/function";

export const trackError = (context: Context, logPrefix: string) => (
  error: Error
): Error => {
  trackException({
    exception: error,
    properties: {
      detail: error.message,
      isSuccess: false,
      name: `cgn.exception.${logPrefix}.failure`
    }
  });
  context.log.error(error.message);
  return error;
};

export const trackErrorAndReturnResponse = <T>(
  context: Context,
  logPrefix: string,
  error: string,
  response: IResponse<T>
) => pipe(new Error(error), trackError(context, logPrefix), _ => response);

export const throwError = (err: Error): boolean => {
  throw err;
};
