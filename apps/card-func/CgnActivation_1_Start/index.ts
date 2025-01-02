import * as express from "express";
import { Context } from "@azure/functions";
import createAzureFunctionHandler from "@pagopa/express-azure-functions/dist/src/createAzureFunctionsHandler";
import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { setAppContext } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { USER_CGN_COLLECTION_NAME, UserCgnModel } from "../models/user_cgn";
import { getConfigOrThrow } from "../utils/config";
import { cosmosdbClient } from "../utils/cosmosdb";
import { StartCgnActivation } from "./handler";
import { QueueStorage } from "../utils/queue";
import initTelemetryClient from "../utils/appinsights";

const config = getConfigOrThrow();

initTelemetryClient();

const userCgnsContainer = cosmosdbClient
  .database(config.COSMOSDB_CGN_DATABASE_NAME)
  .container(USER_CGN_COLLECTION_NAME);

const userCgnModel = new UserCgnModel(userCgnsContainer);

const queueStorage: QueueStorage = new QueueStorage(config);

// Setup Express
const app = express();
secureExpressApp(app);

// Add express route
app.post(
  "/api/v1/cgn/:fiscalcode/activation",
  StartCgnActivation(userCgnModel, config.CGN_UPPER_BOUND_AGE, queueStorage)
);

const azureFunctionHandler = createAzureFunctionHandler(app);

// Binds the express app to an Azure Function handler
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function httpStart(context: Context): void {
  setAppContext(app, context);
  azureFunctionHandler(context);
}

export default httpStart;
