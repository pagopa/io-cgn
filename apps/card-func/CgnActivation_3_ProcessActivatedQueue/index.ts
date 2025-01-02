import { AzureFunction } from "@azure/functions";
import { ServicesAPIClient } from "../clients/services";
import { USER_CGN_COLLECTION_NAME, UserCgnModel } from "../models/user_cgn";
import { getConfigOrThrow } from "../utils/config";
import { cosmosdbClient } from "../utils/cosmosdb";
import { QueueStorage } from "../utils/queue";
import { handler } from "./handler";
import initTelemetryClient from "../utils/appinsights";

const config = getConfigOrThrow();

initTelemetryClient();

const userCgnsContainer = cosmosdbClient
  .database(config.COSMOSDB_CGN_DATABASE_NAME)
  .container(USER_CGN_COLLECTION_NAME);

const userCgnModel = new UserCgnModel(userCgnsContainer);

const queueStorage: QueueStorage = new QueueStorage(config);

export const index: AzureFunction = handler(userCgnModel, ServicesAPIClient, queueStorage, config.EYCA_UPPER_BOUND_AGE);

export default index;
