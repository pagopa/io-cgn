import { IncomingMessage, Server } from "http";
import { FastifyReply, FastifyRequest, RouteHandlerMethod } from "fastify";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { KeyOrganizationFiscalCode } from "../../generated/definitions/KeyOrganizationFiscalCode";
import { ReferentFiscalCode } from "../../generated/definitions/ReferentFiscalCode";
import { IDeleteReferentPathParams } from "../models/parameters";
import {
  toFastifyReply,
  toInternalServerError,
  toNotFoundResponse,
  toSuccessFastifyReply
} from "../utils/response";
import {
  deleteReferent,
  getReferents,
  insertReferent
} from "../services/referentService";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getReferentsHandler = () => async (
  request: FastifyRequest<
    {
      readonly Params: KeyOrganizationFiscalCode;
    },
    Server,
    IncomingMessage
  >,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reply: FastifyReply
) =>
  pipe(
    getReferents(request.params.keyOrganizationFiscalCode),
    TE.mapLeft(toInternalServerError),
    TE.chainW(
      TE.fromOption(() => toNotFoundResponse("Organization Not Found"))
    ),
    TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
    TE.toUnion
  )();

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const insertReferentHandler = () => async (
  request: FastifyRequest<
    {
      readonly Params: KeyOrganizationFiscalCode;
      readonly Body: ReferentFiscalCode;
    },
    Server,
    IncomingMessage
  >,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reply: FastifyReply
) =>
  pipe(
    insertReferent(
      request.params.keyOrganizationFiscalCode,
      request.body.referentFiscalCode
    ),
    TE.mapLeft(toInternalServerError),
    TE.chainW(
      TE.fromOption(() => toNotFoundResponse("Organization Not Found"))
    ),
    TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
    TE.toUnion
  )();

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const deleteReferentHandler = () => async (
  request: FastifyRequest<
    {
      readonly Params: IDeleteReferentPathParams;
    },
    Server,
    IncomingMessage
  >,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reply: FastifyReply
) =>
  pipe(
    deleteReferent(
      request.params.keyOrganizationFiscalCode,
      request.params.referentFiscalCode
    ),
    TE.mapLeft(toInternalServerError),
    TE.chainW(
      TE.fromOption(() =>
        toNotFoundResponse("Organization or Referent Not Found")
      )
    ),
    TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
    TE.toUnion
  )();
