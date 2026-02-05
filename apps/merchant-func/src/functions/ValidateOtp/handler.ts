import { HttpRequest, InvocationContext } from "@azure/functions";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { parse } from "fp-ts/lib/Json";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { OtpCode } from "../../../generated/definitions/OtpCode.js";
import { OtpValidationResponse } from "../../../generated/definitions/OtpValidationResponse.js";
import { Timestamp } from "../../../generated/definitions/Timestamp.js";
import { ValidateOtpPayload } from "../../../generated/definitions/ValidateOtpPayload.js";
import { trackErrorToVoid } from "../../utils/appinsights.js";
import {
  requireBodyPayload,
  withMiddlewares,
  wrapV4RequestHandler,
} from "../../utils/middleware.js";
import { errorObfuscation } from "../../utils/privacy.js";
import { RedisClientFactory } from "../../utils/redis.js";
import { deleteTask, getTask } from "../../utils/redis_storage.js";

// This value is used on redis to prefix key value pair of type
// KEY            | VALUE
// OTP_${otp_code}| {fiscalCode: "...", expires_at: "...", ttl: "..."}
// This prefix must be the same used by io-functions-cgn
// here https://github.com/pagopa/io-functions-cgn/blob/e2607c695556fecdccce8e969c5da978a641fc61/GenerateOtp/redis.ts#L23
export const OTP_PREFIX = "OTP_";

// This value is used on redis to prefix key value pair of type
// KEY                          | VALUE
// OTP_FISCALCODE_${fiscalCode} | otp_code
// This prefix must be the same used by io-functions-cgn
// here https://github.com/pagopa/io-functions-cgn/blob/e2607c695556fecdccce8e969c5da978a641fc61/GenerateOtp/redis.ts#L22
export const OTP_FISCAL_CODE_PREFIX = "OTP_FISCALCODE_";

type ValidateOtpResponseTypes =
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorInternal
  | IResponseErrorNotFound
  | IResponseSuccessJson<OtpValidationResponse>;

type IGetValidateOtpHandler = (
  payload: ValidateOtpPayload,
  request: HttpRequest,
  context: InvocationContext,
) => TE.TaskEither<
  ValidateOtpResponseTypes,
  IResponseSuccessJson<OtpValidationResponse>
>;

export const CommonOtpPayload = t.interface({
  expiresAt: Timestamp,
  fiscalCode: FiscalCode,
});

export type CommonOtpPayload = t.TypeOf<typeof CommonOtpPayload>;

export const OtpResponseAndFiscalCode = t.interface({
  fiscalCode: FiscalCode,
  otpResponse: OtpValidationResponse,
});

export type OtpResponseAndFiscalCode = t.TypeOf<
  typeof OtpResponseAndFiscalCode
>;

const retrieveOtp = (
  redisClientFactory: RedisClientFactory,
  otpCode: OtpCode,
): TE.TaskEither<Error, O.Option<OtpResponseAndFiscalCode>> =>
  pipe(
    getTask(redisClientFactory, `${OTP_PREFIX}${otpCode}`),
    TE.chain(
      O.fold(
        () => TE.of(O.none),
        flow(
          parse,
          E.mapLeft(E.toError),
          TE.fromEither,
          TE.chain(
            flow(
              CommonOtpPayload.decode,
              TE.fromEither,
              TE.mapLeft(
                (e) =>
                  new Error(`Cannot decode Otp Payload [${readableReport(e)}]`),
              ),
            ),
          ),
          TE.map((otpPayload) =>
            O.some({
              fiscalCode: otpPayload.fiscalCode,
              otpResponse: {
                expires_at: otpPayload.expiresAt,
              },
            }),
          ),
        ),
      ),
    ),
  );

const invalidateOtp = (
  redisClientFactory: RedisClientFactory,
  otpCode: OtpCode,
  fiscalCode: FiscalCode,
): TE.TaskEither<Error, true> =>
  pipe(
    deleteTask(redisClientFactory, `${OTP_PREFIX}${otpCode}`),
    TE.chain(
      TE.fromPredicate(
        (result) => result,
        () => new Error("Unexpected delete OTP operation"),
      ),
    ),
    TE.chain(() =>
      deleteTask(redisClientFactory, `${OTP_FISCAL_CODE_PREFIX}${fiscalCode}`),
    ),
    TE.chain(
      TE.fromPredicate(
        (result) => result,
        () => new Error("Unexpected delete fiscalCode operation"),
      ),
    ),
    TE.map(() => true),
  );

export const ValidateOtpHandler =
  (redisClientFactory: RedisClientFactory): IGetValidateOtpHandler =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (payload, _request, _context): ReturnType<IGetValidateOtpHandler> => {
    const obfuscate = errorObfuscation(
      payload.otp_code.toString() as NonEmptyString,
    );
    return pipe(
      retrieveOtp(redisClientFactory, payload.otp_code),
      TE.mapLeft(
        flow(obfuscate, trackErrorToVoid, () =>
          ResponseErrorInternal("Cannot validate OTP"),
        ),
      ),
      TE.chain(
        O.fold(
          () =>
            TE.left<IResponseErrorInternal | IResponseErrorNotFound>(
              ResponseErrorNotFound("Not Found", "OTP Not Found or invalid"),
            ),
          (otpResponseAndFiscalCode) =>
            payload.invalidate_otp
              ? pipe(
                  invalidateOtp(
                    redisClientFactory,
                    payload.otp_code,
                    otpResponseAndFiscalCode.fiscalCode,
                  ),
                  TE.bimap(
                    flow(obfuscate, trackErrorToVoid, () =>
                      ResponseErrorInternal("Cannot invalidate OTP"),
                    ),
                    () => ({
                      expires_at: new Date(),
                    }),
                  ),
                )
              : TE.of(otpResponseAndFiscalCode.otpResponse),
        ),
      ),
      TE.map(ResponseSuccessJson),
    );
  };

export const ValidateOtp = (redisClientFactory: RedisClientFactory) => {
  const handler = ValidateOtpHandler(redisClientFactory);

  const middlewareWrap = withMiddlewares(
    requireBodyPayload(ValidateOtpPayload),
  )(handler);

  return wrapV4RequestHandler(middlewareWrap);
};
