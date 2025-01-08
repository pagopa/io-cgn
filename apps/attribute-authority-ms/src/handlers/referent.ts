import { FastifyReply, FastifyRequest } from "fastify";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { IncomingMessage, Server } from "http";

import { KeyOrganizationFiscalCode } from "../../generated/definitions/KeyOrganizationFiscalCode";
import { ReferentFiscalCode } from "../../generated/definitions/ReferentFiscalCode";
import { IDeleteReferentPathParams } from "../models/parameters";
import {
  deleteReferent,
  getReferents,
  insertReferent,
} from "../services/referentService";
import {
  toFastifyReply,
  toInternalServerError,
  toNotFoundResponse,
  toSuccessFastifyReply,
} from "../utils/response";

export const getReferentsHandler =
  () =>
  async (
    request: FastifyRequest<
      {
        readonly Params: KeyOrganizationFiscalCode;
      },
      Server,
      IncomingMessage
    >,

    reply: FastifyReply,
  ) =>
    pipe(
      getReferents(request.params.keyOrganizationFiscalCode),
      TE.mapLeft(toInternalServerError),
      TE.chainW(
        TE.fromOption(() => toNotFoundResponse("Organization Not Found")),
      ),
      TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
      TE.toUnion,
    )();

export const insertReferentHandler =
  () =>
  async (
    request: FastifyRequest<
      {
        readonly Body: ReferentFiscalCode;
        readonly Params: KeyOrganizationFiscalCode;
      },
      Server,
      IncomingMessage
    >,

    reply: FastifyReply,
  ) =>
    pipe(
      insertReferent(
        request.params.keyOrganizationFiscalCode,
        request.body.referentFiscalCode,
      ),
      TE.mapLeft(toInternalServerError),
      TE.chainW(
        TE.fromOption(() => toNotFoundResponse("Organization Not Found")),
      ),
      TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
      TE.toUnion,
    )();

export const deleteReferentHandler =
  () =>
  async (
    request: FastifyRequest<
      {
        readonly Params: IDeleteReferentPathParams;
      },
      Server,
      IncomingMessage
    >,

    reply: FastifyReply,
  ) =>
    pipe(
      deleteReferent(
        request.params.keyOrganizationFiscalCode,
        request.params.referentFiscalCode,
      ),
      TE.mapLeft(toInternalServerError),
      TE.chainW(
        TE.fromOption(() =>
          toNotFoundResponse("Organization or Referent Not Found"),
        ),
      ),
      TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
      TE.toUnion,
    )();
