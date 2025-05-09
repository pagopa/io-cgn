import {
  IResponseErrorValidation,
  ResponseErrorFromValidationErrors,
} from "@pagopa/ts-commons/lib/responses";
import { Request } from "express";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

// TODO move to https://github.com/pagopa/io-functions-commons project
/**
 * Returns a request middleware that validates the presence of an optional
 * parameter in the request.query object.
 *
 * @param name  The name of the parameter
 * @param type  The io-ts Type for validating the parameter
 */
export const OptionalQueryParamMiddleware =
  <S, A>(name: string, type: t.Type<A, S>) =>
  (
    request: Request,
  ): Promise<E.Either<IResponseErrorValidation, O.Option<A>>> =>
    pipe(
      O.fromNullable(request.query[name]),
      O.fold(
        () => TE.of(O.none),
        flow(
          type.decode,
          TE.fromEither,
          TE.bimap(ResponseErrorFromValidationErrors(type), O.some),
        ),
      ),
    )();
