import { FastifyReply, FastifyRequest } from "fastify";
import { RouteGenericInterface, RouteHandlerMethod } from "fastify/types/route";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { IncomingMessage, Server, ServerResponse } from "http";

import { KeyOrganizationFiscalCode } from "../../generated/definitions/KeyOrganizationFiscalCode";
import { OrganizationWithReferents } from "../../generated/definitions/OrganizationWithReferents";
import { Organizations } from "../../generated/definitions/Organizations";
import { IGetOrganizationsQueryString } from "../models/parameters";
import {
  deleteOrganization,
  getOrganization,
  getOrganizations,
  upsertOrganization,
} from "../services/organizationService";
import {
  toFastifyReply,
  toInternalServerError,
  toNotFoundResponse,
  toSuccessFastifyReply,
} from "../utils/response";

export const getOrganizationsHandler =
  () =>
  async (
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
    >,
  ) =>
    pipe(
      getOrganizations(
        request.query.page,
        request.query.pageSize,
        request.query.searchQuery,
        request.query.sortBy,
        request.query.sortDirection,
      ),
      TE.mapLeft(toInternalServerError),
      TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
      TE.toUnion,
    )();

export const upsertOrganizationHandler =
  () =>
  async (
    request: FastifyRequest<
      {
        readonly Body: Omit<OrganizationWithReferents, "insertedAt">;
      },
      Server,
      IncomingMessage
    >,
    reply: FastifyReply,
  ) =>
    pipe(
      upsertOrganization({ ...request.body, insertedAt: new Date() }),
      TE.mapLeft(toInternalServerError),
      TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
      TE.toUnion,
    )();

export const getOrganizationHandler =
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
      getOrganization(request.params.keyOrganizationFiscalCode),
      TE.mapLeft(toInternalServerError),
      TE.chainW(
        TE.fromOption(() => toNotFoundResponse("Organization Not Found")),
      ),
      TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
      TE.toUnion,
    )();

export const deleteOrganizationHandler =
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
  ) => {
    pipe(
      deleteOrganization(request.params.keyOrganizationFiscalCode),
      TE.mapLeft(toInternalServerError),
      TE.chainW(
        TE.fromOption(() => toNotFoundResponse("Organization Not Found")),
      ),
      TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
      TE.toUnion,
    )();
  };
