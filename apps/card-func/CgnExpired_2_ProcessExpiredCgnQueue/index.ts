import { AzureFunction } from "@azure/functions";

import { USER_CGN_COLLECTION_NAME, UserCgnModel } from "../models/user_cgn";
import initTelemetryClient from "../utils/appinsights";
import { getConfigOrThrow } from "../utils/config";
import { cosmosdbClient } from "../utils/cosmosdb";
import { QueueStorage } from "../utils/queue";
import { handler } from "./handler";

const config = getConfigOrThrow();

initTelemetryClient();

const userCgnsContainer = cosmosdbClient
  .database(config.COSMOSDB_CGN_DATABASE_NAME)
  .container(USER_CGN_COLLECTION_NAME);

const userCgnModel = new UserCgnModel(userCgnsContainer);

const queueStorage: QueueStorage = new QueueStorage(config);

export const index: AzureFunction = handler(userCgnModel, queueStorage);

export default index;
