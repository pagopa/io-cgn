import { IncomingMessage, Server, ServerResponse } from "http";
import { FastifyReply, FastifyRequest } from "fastify";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { RouteGenericInterface, RouteHandlerMethod } from "fastify/types/route";
import { KeyOrganizationFiscalCode } from "../../generated/definitions/KeyOrganizationFiscalCode";
import { OrganizationWithReferents } from "../../generated/definitions/OrganizationWithReferents";
import {
  deleteOrganization,
  getOrganization,
  getOrganizations,
  upsertOrganization
} from "../services/organizationService";
import {
  toFastifyReply,
  toInternalServerError,
  toNotFoundResponse,
  toSuccessFastifyReply
} from "../utils/response";
import { Organizations } from "../../generated/definitions/Organizations";
import { IGetOrganizationsQueryString } from "../models/parameters";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getOrganizationsHandler = () => async (
  request: FastifyRequest<
    {
      readonly Querystring: IGetOrganizationsQueryString;
      readonly Response: Organizations;
    },
    Server,
    IncomingMessage
  >,
  reply: FastifyReply<
    Server,
    IncomingMessage,
    ServerResponse,
    RouteGenericInterface,
    unknown
  >
) =>
  pipe(
    getOrganizations(
      request.query.page,
      request.query.pageSize,
      request.query.searchQuery,
      request.query.sortBy,
      request.query.sortDirection
    ),
    TE.mapLeft(toInternalServerError),
    TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
    TE.toUnion
  )();

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const upsertOrganizationHandler = () => async (
  request: FastifyRequest<
    {
      readonly Body: Omit<OrganizationWithReferents,'insertedAt'>;
    },
    Server,
    IncomingMessage
  >,
  reply: FastifyReply
) =>
  pipe(
    upsertOrganization({...request.body, insertedAt: new Date()}),
    TE.mapLeft(toInternalServerError),
    TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
    TE.toUnion
  )();

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getOrganizationHandler = () => async (
  request: FastifyRequest<
    {
      readonly Params: KeyOrganizationFiscalCode;
    },
    Server,
    IncomingMessage
  >,
  reply: FastifyReply
) =>
  pipe(
    getOrganization(request.params.keyOrganizationFiscalCode),
    TE.mapLeft(toInternalServerError),
    TE.chainW(
      TE.fromOption(() => toNotFoundResponse("Organization Not Found"))
    ),
    TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
    TE.toUnion
  )();

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const deleteOrganizationHandler = () => async (
  request: FastifyRequest<
    {
      readonly Params: KeyOrganizationFiscalCode;
    },
    Server,
    IncomingMessage
  >,
  reply: FastifyReply
) => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  pipe(
    deleteOrganization(request.params.keyOrganizationFiscalCode),
    TE.mapLeft(toInternalServerError),
    TE.chainW(
      TE.fromOption(() => toNotFoundResponse("Organization Not Found"))
    ),
    TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
    TE.toUnion
  )();
};
