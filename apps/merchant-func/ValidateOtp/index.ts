import * as express from "express";
import { Context } from "@azure/functions";
import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { AzureContextTransport } from "@pagopa/io-functions-commons/dist/src/utils/logging";
import { setAppContext } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import createAzureFunctionHandler from "@pagopa/express-azure-functions/dist/src/createAzureFunctionsHandler";
import { getRedisClientFactory } from "../utils/redis";
import { getConfigOrThrow } from "../utils/config";
import { ValidateOtp } from "./handler";
import initTelemetryClient from "../utils/appinsights";

// load config and ensure it is correct
const config = getConfigOrThrow();

// initialize telemetry client
initTelemetryClient();

// Setup Express
const app = express();
secureExpressApp(app);

const redisClientFactory = getRedisClientFactory(config);

// Add express route
app.post("/api/v1/merchant/cgn/otp/validate", ValidateOtp(redisClientFactory));

const azureFunctionHandler = createAzureFunctionHandler(app);

// Binds the express app to an Azure Function handler
const httpStart = (context: Context): void => {
  setAppContext(app, context);
  azureFunctionHandler(context);
};

export default httpStart;
