import { AzureFunction } from "@azure/functions";
import { createTableService } from "azure-storage";

import { ServicesAPIClient } from "../clients/services";
import { USER_CGN_COLLECTION_NAME, UserCgnModel } from "../models/user_cgn";
import initTelemetryClient from "../utils/appinsights";
import { getConfigOrThrow } from "../utils/config";
import { cosmosdbClient } from "../utils/cosmosdb";
import { QueueStorage } from "../utils/queue";
import { insertCardExpiration } from "../utils/table_storage";
import { handler } from "./handler";

const config = getConfigOrThrow();

initTelemetryClient();

const userCgnsContainer = cosmosdbClient
  .database(config.COSMOSDB_CGN_DATABASE_NAME)
  .container(USER_CGN_COLLECTION_NAME);

const userCgnModel = new UserCgnModel(userCgnsContainer);

const tableService = createTableService(config.CGN_STORAGE_CONNECTION_STRING);

const storeCgnExpiration = insertCardExpiration(
  tableService,
  config.CGN_EXPIRATION_TABLE_NAME,
);

const queueStorage: QueueStorage = new QueueStorage(config);

export const index: AzureFunction = handler(
  userCgnModel,
  ServicesAPIClient,
  storeCgnExpiration,
  queueStorage,
);

export default index;
