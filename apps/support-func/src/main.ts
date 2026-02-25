/**
 * Azure Functions v4 entry point — src/main.ts
 *
 * This file replaces all per-function index.ts entry points.
 */

import { app } from "@azure/functions";

import { GetUserInfo } from "../GetUserInfo/handler";
import { Info } from "../Health/handler";
import { USER_CGN_COLLECTION_NAME, UserCgnModel } from "../models/user_cgn";
import {
  USER_EYCA_CARD_COLLECTION_NAME,
  UserEycaCardModel,
} from "../models/user_eyca_card";
import initTelemetryClient from "../utils/appinsights";
import { getConfigOrThrow } from "../utils/config";
import { getCosmosDbClientInstance } from "../utils/cosmosdb";

// ---------------------------------------------------------------------------
// CONFIG SETUP
// ---------------------------------------------------------------------------
const config = getConfigOrThrow();

// ---------------------------------------------------------------------------
// TELEMETRY
// ---------------------------------------------------------------------------
initTelemetryClient();

// ---------------------------------------------------------------------------
// COSMOSDB INITIALISATION
// ---------------------------------------------------------------------------
const cosmosdbClient = getCosmosDbClientInstance(
  config.COSMOSDB_CGN_URI,
  config.COSMOSDB_CGN_KEY,
);

const userCgnsContainer = cosmosdbClient
  .database(config.COSMOSDB_CGN_DATABASE_NAME)
  .container(USER_CGN_COLLECTION_NAME);

const userCgnModel = new UserCgnModel(userCgnsContainer);

const userEycasContainer = cosmosdbClient
  .database(config.COSMOSDB_CGN_DATABASE_NAME)
  .container(USER_EYCA_CARD_COLLECTION_NAME);

const userEycaModel = new UserEycaCardModel(userEycasContainer);

// ---------------------------------------------------------------------------
// HTTP TRIGGERS
// ---------------------------------------------------------------------------

app.http("GetUserInfo", {
  authLevel: "function",
  handler: GetUserInfo(userCgnModel, userEycaModel),
  methods: ["POST"],
  route: "api/v1/cgn-support/user-info",
});

app.http("Health", {
  authLevel: "anonymous",
  handler: Info(),
  methods: ["GET"],
  route: "api/v1/cgn-support/health",
});
