import { Context } from "@azure/functions";
import createAzureFunctionHandler from "@pagopa/express-azure-functions/dist/src/createAzureFunctionsHandler";
import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { setAppContext } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import * as express from "express";

import { cgnOperatorDb } from "../client/sequelize";
import initTelemetryClient from "../utils/appinsights";
import { getConfigOrThrow } from "../utils/config";
import { Count } from "./handler";

// ensure config is correct
getConfigOrThrow();

// init telemetry client
initTelemetryClient();

const app = express();
secureExpressApp(app);

app.get("/api/v1/cgn/operator-search/count", Count(cgnOperatorDb));

const azureFunctionHandler = createAzureFunctionHandler(app);

const httpStart = (context: Context): void => {
  setAppContext(app, context);
  azureFunctionHandler(context);
};

export default httpStart;
