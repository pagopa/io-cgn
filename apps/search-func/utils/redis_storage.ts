import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { RedisClientFactory } from "./redis";

/**
 * Parse a Redis single string reply.
 *
 * @see https://redis.io/topics/protocol#simple-string-reply.
 */
export const singleStringReplyAsync = (
  command: TE.TaskEither<Error, null | string>,
): TE.TaskEither<Error, boolean> =>
  pipe(
    command,
    TE.map((reply) => reply === "OK"),
  );

/**
 * Parse a Redis single string reply.
 *
 * @see https://redis.io/topics/protocol#simple-string-reply.
 */
export const singleValueReplyAsync = (
  command: TE.TaskEither<Error, null | string>,
): TE.TaskEither<Error, O.Option<string>> =>
  pipe(command, TE.map(O.fromNullable));

/**
 * Parse a Redis integer reply.
 *
 * @see https://redis.io/topics/protocol#integer-reply
 */
export const integerReplAsync =
  (expectedReply?: number) =>
  (command: TE.TaskEither<Error, unknown>): TE.TaskEither<Error, boolean> =>
    pipe(
      command,
      TE.map((reply) => {
        if (expectedReply !== undefined && expectedReply !== reply) {
          return false;
        }
        return typeof reply === "number";
      }),
    );

/**
 * Transform any Redis falsy response to an error
 *
 * @param response
 * @param error
 * @returns
 */
export const falsyResponseToErrorAsync =
  (error: Error) =>
  (response: TE.TaskEither<Error, boolean>): TE.TaskEither<Error, true> =>
    pipe(
      response,
      TE.chain((res) => (res ? TE.right(res) : TE.left(error))),
    );

export const popFromList = (
  redisClientFactory: RedisClientFactory,
  key: string,
): TE.TaskEither<Error, O.Option<string>> =>
  pipe(
    TE.tryCatch(() => redisClientFactory.getInstance(), E.toError),
    TE.chain((redisClient) =>
      TE.tryCatch(() => redisClient.LPOP(key), E.toError),
    ),
    singleValueReplyAsync,
  );

export const pushInList = (
  redisClientFactory: RedisClientFactory,
  key: string,
  codes: readonly string[],
): TE.TaskEither<Error, boolean> =>
  pipe(
    TE.tryCatch(() => redisClientFactory.getInstance(), E.toError),
    TE.chain((redisClient) =>
      TE.tryCatch(() => redisClient.LPUSH(key, [...codes]), E.toError),
    ),
    integerReplAsync(),
  );
