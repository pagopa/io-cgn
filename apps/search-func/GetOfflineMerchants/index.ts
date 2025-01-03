import * as express from "express";
import { Context } from "@azure/functions";
import createAzureFunctionHandler from "@pagopa/express-azure-functions/dist/src/createAzureFunctionsHandler";
import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { setAppContext } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { cgnOperatorDb } from "../client/sequelize";
import { GetOfflineMerchants } from "./handler";
import initTelemetryClient from "../utils/appinsights";
import { getConfigOrThrow } from "../utils/config";

// ensure config is correct
getConfigOrThrow();

// init telemetry client
initTelemetryClient();

// Setup Express
const app = express();
secureExpressApp(app);

// Add express route
app.post(
  "/api/v1/cgn/operator-search/offline-merchants",
  GetOfflineMerchants(cgnOperatorDb)
);

const azureFunctionHandler = createAzureFunctionHandler(app);

// Binds the express app to an Azure Function handler
const httpStart = (context: Context): void => {
  setAppContext(app, context);
  azureFunctionHandler(context);
};

export default httpStart;
