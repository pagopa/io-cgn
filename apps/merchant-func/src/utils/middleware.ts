import { HttpRequest, InvocationContext } from "@azure/functions";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters.js";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorValidation,
} from "@pagopa/ts-commons/lib/responses.js";
import * as E from "fp-ts/lib/Either.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { pipe } from "fp-ts/lib/function.js";
import * as t from "io-ts";

/**
 * Azure Functions V4 HttpResponseInit-compatible response type
 */
export interface HttpResponseInit {
  body?: string;
  headers?: Record<string, string>;
  jsonBody?: unknown;
  status: number;
}

/**
 * Standard response types from io-functions-commons
 */
export type ResponseTypes<T = unknown> =
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorInternal
  | IResponseErrorNotFound
  | IResponseErrorValidation
  | IResponseSuccessJson<T>;

/**
 * Handler type that returns a TaskEither with standard response types
 */
export type RequestHandler<T = unknown> = (
  request: HttpRequest,
  context: InvocationContext,
) => TE.TaskEither<ResponseTypes, IResponseSuccessJson<T>>;

/**
 * Converts standard response types from io-functions-commons to V4 HttpResponseInit
 */
export const toHttpResponse = <T>(
  response: ResponseTypes<T>,
): HttpResponseInit => {
  switch (response.kind) {
    case "IResponseSuccessJson":
      return {
        headers: {
          "Content-Type": "application/json",
        },
        jsonBody: response.value,
        status: 200,
      };
    case "IResponseErrorValidation":
      return {
        headers: {
          "Content-Type": "application/problem+json",
        },
        jsonBody: {
          detail: response.detail,
          status: 400,
          title: response.detail,
        },
        status: 400,
      };
    case "IResponseErrorInternal":
      return {
        headers: {
          "Content-Type": "application/problem+json",
        },
        jsonBody: {
          detail: response.detail,
          status: 500,
          title: "Internal Server Error",
        },
        status: 500,
      };
    case "IResponseErrorNotFound":
      return {
        headers: {
          "Content-Type": "application/problem+json",
        },
        jsonBody: {
          detail: response.detail,
          status: 404,
          title: response.detail,
        },
        status: 404,
      };
    case "IResponseErrorForbiddenNotAuthorized":
      return {
        headers: {
          "Content-Type": "application/problem+json",
        },
        jsonBody: {
          detail: response.detail,
          status: 403,
          title: "Forbidden",
        },
        status: 403,
      };
    default:
      return {
        headers: {
          "Content-Type": "application/problem+json",
        },
        jsonBody: {
          detail: "Unknown response type",
          status: 500,
          title: "Internal Server Error",
        },
        status: 500,
      };
  }
};

/**
 * Wraps a request handler that returns TaskEither to properly handle errors
 * and convert responses to V4 HttpResponseInit format
 */
export const wrapV4RequestHandler =
  <T>(
    handler: (
      request: HttpRequest,
      context: InvocationContext,
    ) => TE.TaskEither<ResponseTypes<T>, IResponseSuccessJson<T>>,
  ) =>
  async (
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> =>
    pipe(
      handler(request, context),
      TE.toUnion,
    )().then(toHttpResponse);

/**
 * Middleware to extract and validate request body using io-ts codec
 */
export const requireBodyPayload =
  <T>(codec: t.Type<T, unknown, unknown>) =>
  (request: HttpRequest): TE.TaskEither<ResponseTypes, T> =>
    pipe(
      TE.tryCatch(
        async () => {
          const body = await request.text();
          if (!body) {
            throw new Error("Empty request body");
          }
          return JSON.parse(body) as unknown;
        },
        (error) =>
          ResponseErrorValidation(
            "Invalid JSON",
            `Could not parse request body: ${String(error)}`,
          ),
      ),
      TE.chain((bodyJson) =>
        pipe(
          codec.decode(bodyJson),
          E.mapLeft((errors) =>
            ResponseErrorValidation(
              "Invalid payload",
              readableReportSimplified(errors),
            ),
          ),
          TE.fromEither,
        ),
      ),
    );

/**
 * Middleware composer that allows chaining multiple validation steps
 * Usage:
 *   withMiddlewares(
 *     requireBodyPayload(ValidateOtpPayload)
 *   )(handler)
 */
export const withMiddlewares =
  <TPayload>(
    middleware: (
      request: HttpRequest,
    ) => TE.TaskEither<ResponseTypes, TPayload>,
  ) =>
  <TResult>(
    handler: (
      payload: TPayload,
      request: HttpRequest,
      context: InvocationContext,
    ) => TE.TaskEither<ResponseTypes<TResult>, IResponseSuccessJson<TResult>>,
  ) =>
  (
    request: HttpRequest,
    context: InvocationContext,
  ): TE.TaskEither<ResponseTypes<TResult>, IResponseSuccessJson<TResult>> =>
    pipe(
      middleware(request) as TE.TaskEither<ResponseTypes<TResult>, TPayload>,
      TE.chain((payload) => handler(payload, request, context)),
    );

/**
 * Simple handler wrapper for endpoints that don't need request body validation
 */
export const simpleHandler =
  <T>(
    handler: (
      request: HttpRequest,
      context: InvocationContext,
    ) => TE.TaskEither<ResponseTypes<T>, IResponseSuccessJson<T>>,
  ) =>
  async (
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> =>
    wrapV4RequestHandler(handler)(request, context);
