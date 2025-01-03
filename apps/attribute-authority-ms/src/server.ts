import { FastifyInstance, FastifyRequest, fastify } from "fastify";
import { ContentTypeParserDoneFunction } from "fastify/types/content-type-parser";
import { RouteGenericInterface } from "fastify/types/route";
import * as TE from "fp-ts/lib/TaskEither";
import { IncomingMessage, Server, ServerResponse } from "http";
import { Sequelize } from "sequelize";

import { Companies } from "../generated/definitions/Companies";
import { GetCompaniesBody } from "../generated/definitions/GetCompaniesBody";
import { KeyOrganizationFiscalCode } from "../generated/definitions/KeyOrganizationFiscalCode";
import { OrganizationWithReferentsPost } from "../generated/definitions/OrganizationWithReferentsPost";
import { Organizations } from "../generated/definitions/Organizations";
import { ReferentFiscalCode } from "../generated/definitions/ReferentFiscalCode";
import { getCompaniesHandler } from "./handlers/company";
import * as organizationHandler from "./handlers/organization";
import * as referentHandler from "./handlers/referent";
import { pathParamsMiddleware } from "./middlewares/path_params";
import { queryParamsMiddleware } from "./middlewares/query_params";
import {
  withDoubleRequestMiddlewares,
  withRequestMiddlewares,
} from "./middlewares/request_middleware";
import { requiredBodyMiddleware } from "./middlewares/required_body_payload";
import { initModels } from "./models/dbModels";
import {
  IDeleteReferentPathParams,
  IGetOrganizationsQueryString,
} from "./models/parameters";
import { getConfigOrThrow } from "./utils/config";
import { sequelizePostgresOptions } from "./utils/sequelize-options";

const config = getConfigOrThrow();

// Create a http server. We pass the relevant typings for our http version used.
// By passing types we get correctly typed access to the underlying http objects in routes.
// If using http2 we'd pass <http2.Http2Server, http2.Http2ServerRequest, http2.Http2ServerResponse>
const server: FastifyInstance<Server, IncomingMessage, ServerResponse> =
  fastify({});

const attributeAuthorityPostgresDb = new Sequelize(
  config.ATTRIBUTE_AUTHORITY_POSTGRES_DB_URI,
  sequelizePostgresOptions(),
);

// Initialize models and sync them
initModels(attributeAuthorityPostgresDb);

/**
 * FIX for null body when content type is "application/json"
 */
server.addContentTypeParser(
  "application/json",
  { parseAs: "string" },
  (
    _: FastifyRequest<
      RouteGenericInterface,
      Server<typeof IncomingMessage, typeof ServerResponse>,
      IncomingMessage,
      unknown
    >,
    body: string,
    done: ContentTypeParserDoneFunction,
  ) => {
    try {
      if (!body) {
        done(null, null);
      }
      const json = JSON.parse(body);
      done(null, json);
    } catch (err) {
      done({ ...(err as SyntaxError) }, undefined);
    }
  },
);

server.get<{
  readonly Querystring: IGetOrganizationsQueryString;
  readonly Response: Organizations;
}>(
  "/organizations",
  {
    preHandler: async (request, reply) =>
      withRequestMiddlewares(
        request,
        reply,
        queryParamsMiddleware(IGetOrganizationsQueryString),
      ),
  },
  organizationHandler.getOrganizationsHandler(),
);

server.post<{ readonly Body: OrganizationWithReferentsPost }>(
  "/organizations",
  {
    preHandler: async (request, reply) =>
      withRequestMiddlewares(
        request,
        reply,
        requiredBodyMiddleware(OrganizationWithReferentsPost),
      ),
  },
  organizationHandler.upsertOrganizationHandler(),
);

server.get(
  "/organization/:keyOrganizationFiscalCode",
  {
    preHandler: async (request, reply) =>
      withRequestMiddlewares(
        request,
        reply,
        pathParamsMiddleware(KeyOrganizationFiscalCode),
      ),
  },
  organizationHandler.getOrganizationHandler(),
);

server.delete(
  "/organization/:keyOrganizationFiscalCode",
  {
    preHandler: async (request, reply) =>
      withRequestMiddlewares(
        request,
        reply,
        pathParamsMiddleware(KeyOrganizationFiscalCode),
      ),
  },
  organizationHandler.deleteOrganizationHandler(),
);

server.get(
  "/organization/:keyOrganizationFiscalCode/referents",
  {
    preHandler: async (request, reply) =>
      withRequestMiddlewares(
        request,
        reply,
        pathParamsMiddleware(KeyOrganizationFiscalCode),
      ),
  },
  referentHandler.getReferentsHandler(),
);

server.post<{
  readonly Body: ReferentFiscalCode;
  readonly Params: KeyOrganizationFiscalCode;
}>(
  "/organization/:keyOrganizationFiscalCode/referents",
  {
    preHandler: async (request, reply) =>
      withDoubleRequestMiddlewares(
        request,
        reply,
        pathParamsMiddleware(KeyOrganizationFiscalCode),
        requiredBodyMiddleware(ReferentFiscalCode),
      ),
  },
  referentHandler.insertReferentHandler(),
);

server.delete(
  "/organization/:keyOrganizationFiscalCode/referents/:referentFiscalCode",
  {
    preHandler: async (request, reply) =>
      withRequestMiddlewares(
        request,
        reply,
        pathParamsMiddleware(IDeleteReferentPathParams),
      ),
  },
  referentHandler.deleteReferentHandler(),
);

/**
 * Legacy endpoint to serve hub-spid-login service
 */
server.post<{ readonly Body: GetCompaniesBody; readonly Response: Companies }>(
  "/companies",
  {
    preHandler: async (request, reply) =>
      withRequestMiddlewares(
        request,
        reply,
        requiredBodyMiddleware(GetCompaniesBody),
      ),
  },
  getCompaniesHandler(),
);

server.get("/ping", {}, (_, reply) => TE.of(reply.code(200).send("OK"))());

server.listen(config.SERVER_PORT, "0.0.0.0", (err, address) => {
  if (err) {
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log(`server listening on ${address}`);
});
