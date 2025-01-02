import * as express from "express";
import { Context } from "@azure/functions";
import createAzureFunctionHandler from "@pagopa/express-azure-functions/dist/src/createAzureFunctionsHandler";
import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { setAppContext } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { cgnOperatorDb } from "../client/sequelize";
import { getConfigOrThrow } from "../utils/config";
import { GetMerchant } from "./handler";
import initTelemetryClient from "../utils/appinsights";

const config = getConfigOrThrow();

initTelemetryClient();

// Setup Express
const app = express();
secureExpressApp(app);

// Add express route
app.get(
  "/api/v1/cgn/operator-search/merchants/:merchantId",
  GetMerchant(
    cgnOperatorDb,
    config.CDN_MERCHANT_IMAGES_BASE_URL,
    config.CGN_EXTERNAL_SOURCE_HEADER_NAME
  )
);

const azureFunctionHandler = createAzureFunctionHandler(app);

// Binds the express app to an Azure Function handler
const httpStart = (context: Context): void => {
  setAppContext(app, context);
  azureFunctionHandler(context);
};

export default httpStart;
