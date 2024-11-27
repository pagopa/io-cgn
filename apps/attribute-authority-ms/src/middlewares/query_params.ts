import { FastifyReply, FastifyRequest } from "fastify";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { BadRequestResponse, toBadRequestResponse } from "../utils/response";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const queryParamsMiddleware = <S, A>(type: t.Type<A, S>) => (
  request: FastifyRequest,
  _: FastifyReply
): TE.TaskEither<BadRequestResponse, A> =>
  pipe(
    request.query,
    type.decode,
    TE.fromEither,
    TE.mapLeft(toBadRequestResponse)
  );
