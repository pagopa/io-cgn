import { AzureFunction } from "@azure/functions";
import { createTableService } from "azure-storage";

import { ServicesAPIClient } from "../clients/services";
import { USER_CGN_COLLECTION_NAME, UserCgnModel } from "../models/user_cgn";
import initTelemetryClient from "../utils/appinsights";
import { getConfigOrThrow } from "../utils/config";
import { cosmosdbClient } from "../utils/cosmosdb";
import { deleteCardExpiration } from "../utils/table_storage";
import { handler } from "./handler";

const config = getConfigOrThrow();

initTelemetryClient();

const userCgnsContainer = cosmosdbClient
  .database(config.COSMOSDB_CGN_DATABASE_NAME)
  .container(USER_CGN_COLLECTION_NAME);

const userCgnModel = new UserCgnModel(userCgnsContainer);

const tableService = createTableService(config.CGN_STORAGE_CONNECTION_STRING);

const deleteCgnExpiration = deleteCardExpiration(
  tableService,
  config.CGN_EXPIRATION_TABLE_NAME,
);

export const index: AzureFunction = handler(
  userCgnModel,
  ServicesAPIClient,
  deleteCgnExpiration,
);

export default index;
