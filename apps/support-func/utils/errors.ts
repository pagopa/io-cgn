import { Context } from "@azure/functions";
import { IResponse } from "@pagopa/ts-commons/lib/responses";
import { pipe } from "fp-ts/lib/function";

import { trackErrorToVoid } from "./appinsights";

export const trackError =
  (context: Context, logPrefix: string) =>
  (error: Error): Error => {
    trackErrorToVoid(error, {
      detail: error.message,
      isSuccess: "false",
      name: `cgn.exception.${logPrefix}.failure`,
    });
    return error;
  };

export const trackErrorAndReturnResponse = <T>(
  context: Context,
  logPrefix: string,
  error: string,
  response: IResponse<T>,
) => pipe(new Error(error), trackError(context, logPrefix), () => response);

export const throwError = (err: Error): boolean => {
  throw err;
};
