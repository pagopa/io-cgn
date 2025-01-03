import { FastifyReply } from "fastify/types/reply";
import { FastifyRequest } from "fastify/types/request";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { Response } from "../utils/response";

export const withRequestMiddlewares = (
  request: FastifyRequest,
  reply: FastifyReply,
  M1: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => TE.TaskEither<Response, unknown>,
) =>
  pipe(
    M1(request, reply),
    TE.bimap(
      (_) => reply.code(_.code).send(_),
      () => void 0,
    ),
    TE.toUnion,
  )();

export const withDoubleRequestMiddlewares = (
  request: FastifyRequest,
  reply: FastifyReply,
  M1: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => TE.TaskEither<Response, any>,
  M2: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => TE.TaskEither<Response, any>,
) =>
  pipe(
    M1(request, reply),
    TE.chain(() => M2(request, reply)),
    TE.bimap(
      (_) => reply.code(_.code).send(_),
      () => void 0,
    ),
    TE.toUnion,
  )();
