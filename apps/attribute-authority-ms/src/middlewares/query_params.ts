import { FastifyReply, FastifyRequest } from "fastify";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { BadRequestResponse, toBadRequestResponse } from "../utils/response";

export const queryParamsMiddleware =
  <S, A>(type: t.Type<A, S>) =>
  (
    request: FastifyRequest,
    // eslint-disable-next-line
    _: FastifyReply,
  ): TE.TaskEither<BadRequestResponse, A> =>
    pipe(
      request.query,
      type.decode,
      TE.fromEither,
      TE.mapLeft(toBadRequestResponse),
    );
