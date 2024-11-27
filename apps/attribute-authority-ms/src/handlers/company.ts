import { IncomingMessage, Server } from "http";
import { FastifyReply, FastifyRequest } from "fastify";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { GetCompaniesBody } from "../../generated/definitions/GetCompaniesBody";
import { getCompanies } from "../services/companyService";
import {
  toFastifyReply,
  toInternalServerError,
  toNotFoundResponse,
  toSuccessFastifyReply
} from "../utils/response";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getCompaniesHandler = () => async (
  request: FastifyRequest<
    {
      readonly Body: GetCompaniesBody;
    },
    Server,
    IncomingMessage
  >,
  reply: FastifyReply
) =>
  pipe(
    getCompanies(request.body.fiscalCode),
    TE.mapLeft(toInternalServerError),
    TE.chainW(TE.fromOption(() => toNotFoundResponse("Referent Not Found"))),
    TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
    TE.toUnion
  )();
