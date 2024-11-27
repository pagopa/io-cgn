import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { FastifyReply } from "fastify/types/reply";
import * as t from "io-ts";

export const ResponseDetailMessage = t.partial({
  detail: t.string
});
export type ResponseDetailMessage = t.TypeOf<typeof ResponseDetailMessage>;

export const ResponseErrorMessage = t.interface({
  error: t.string
});
export type ResponseErrorMessage = t.TypeOf<typeof ResponseErrorMessage>;

export const NotFoundResponse = t.intersection([
  t.interface({
    code: t.literal(404)
  }),
  ResponseDetailMessage
]);
export type NotFoundResponse = t.TypeOf<typeof NotFoundResponse>;

export const BadRequestResponse = t.intersection([
  t.interface({
    code: t.literal(400)
  }),
  ResponseErrorMessage,
  ResponseDetailMessage
]);
export type BadRequestResponse = t.TypeOf<typeof BadRequestResponse>;

export const InternalServerErrorResponse = t.intersection([
  t.interface({
    code: t.literal(500)
  }),
  ResponseErrorMessage,
  ResponseDetailMessage
]);
export type InternalServerErrorResponse = t.TypeOf<
  typeof InternalServerErrorResponse
>;

export const SuccessJsonResponse = t.interface({
  code: t.literal(200),
  data: t.object
});
export type SuccessJsonResponse = t.TypeOf<typeof SuccessJsonResponse>;

export const Response = t.union([
  NotFoundResponse,
  BadRequestResponse,
  InternalServerErrorResponse,
  SuccessJsonResponse
]);
export type Response = t.TypeOf<typeof Response>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const toBadRequestResponse = (errs: t.Errors) =>
  BadRequestResponse.encode({
    code: 400,
    error: errorsToReadableMessages(errs).join("/")
  });

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const toInternalServerError = (err: Error) =>
  InternalServerErrorResponse.encode({
    code: 500,
    error: err.message
  });

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const toNotFoundResponse = (message?: string) =>
  NotFoundResponse.encode({
    code: 404,
    detail: message
  });

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const toSuccessJsonResponse = <T>(data: T) =>
  SuccessJsonResponse.encode({
    code: 200,
    data: Object.assign({}, data)
  });

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const toFastifyReply = (reply: FastifyReply) => (res: Response) =>
  reply.code(res.code).send(res);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const toSuccessFastifyReply = <T>(reply: FastifyReply) => (result: T) =>
  reply.code(200).send(result);
