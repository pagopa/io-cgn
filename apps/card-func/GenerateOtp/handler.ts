import { Context } from "@azure/functions";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as date_fns from "date-fns";
import * as express from "express";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { CardActivated } from "../generated/definitions/CardActivated";
import { Otp } from "../generated/definitions/Otp";
import { UserCgnModel } from "../models/user_cgn";
import { generateOtpCode } from "../utils/cgnCode";
import { RedisClientFactory } from "../utils/redis";
import { retrieveOtpByFiscalCode, storeOtpAndRelatedFiscalCode } from "./redis";

type ResponseTypes =
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorInternal
  | IResponseSuccessJson<Otp>;

type IGetGenerateOtpHandler = (
  context: Context,
  fiscalCode: FiscalCode,
) => Promise<ResponseTypes>;

const generateNewOtpAndStore = (
  redisClientFactory: RedisClientFactory,
  fiscalCode: FiscalCode,
  otpTtl: NonNegativeInteger,
): TE.TaskEither<IResponseErrorInternal, Otp> =>
  pipe(
    TE.tryCatch(() => generateOtpCode(), E.toError),
    TE.bimap(
      (e) => ResponseErrorInternal(`Cannot generate OTP Code| ${e.message}`),
      (otpCode) => ({
        code: otpCode,
        expires_at: date_fns.addSeconds(Date.now(), otpTtl),
        ttl: otpTtl,
      }),
    ),
    TE.chain((newOtp) =>
      pipe(
        storeOtpAndRelatedFiscalCode(
          redisClientFactory,
          newOtp.code,
          {
            expiresAt: newOtp.expires_at,
            fiscalCode,
            ttl: otpTtl,
          },
          otpTtl,
        ),
        TE.bimap(
          (err) => ResponseErrorInternal(err.message),
          () => newOtp,
        ),
      ),
    ),
  );

export function GetGenerateOtpHandler(
  userCgnModel: UserCgnModel,
  redisClientFactory: RedisClientFactory,
  otpTtl: NonNegativeInteger,
): IGetGenerateOtpHandler {
  return async (_, fiscalCode) =>
    pipe(
      userCgnModel.findLastVersionByModelId([fiscalCode]),
      TE.mapLeft(() =>
        ResponseErrorInternal("Error trying to retrieve user's CGN status"),
      ),
      TE.chainW(TE.fromOption(() => ResponseErrorForbiddenNotAuthorized)),
      TE.chainW(
        TE.fromPredicate(
          (userCgn) => CardActivated.is(userCgn.card),
          () => ResponseErrorForbiddenNotAuthorized,
        ),
      ),
      TE.chainW(() =>
        pipe(
          retrieveOtpByFiscalCode(redisClientFactory, fiscalCode),
          TE.mapLeft((e) =>
            ResponseErrorInternal(
              `Cannot retrieve OTP from fiscalCode| ${e.message}`,
            ),
          ),
          TE.chain(
            flow(
              O.fold(
                () =>
                  generateNewOtpAndStore(
                    redisClientFactory,
                    fiscalCode,
                    otpTtl,
                  ),
                (otp) => TE.of(otp),
              ),
            ),
          ),
        ),
      ),
      TE.map(ResponseSuccessJson),
      TE.toUnion,
    )();
}

export function GetGenerateOtp(
  userCgnModel: UserCgnModel,
  redisClientFactory: RedisClientFactory,
  otpTtl: NonNegativeInteger,
): express.RequestHandler {
  const handler = GetGenerateOtpHandler(
    userCgnModel,
    redisClientFactory,
    otpTtl,
  );

  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredParamMiddleware("fiscalcode", FiscalCode),
  );

  return wrapRequestHandler(middlewaresWrap(handler));
}
