import { Context } from "@azure/functions";
import { trackException } from "./appinsights";

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
  context.log.error(error);
  return error;
};

export const throwError = (err: Error): boolean => {
    throw err;
};

