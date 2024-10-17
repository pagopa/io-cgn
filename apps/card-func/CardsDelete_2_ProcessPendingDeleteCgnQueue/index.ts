import { AzureFunction, Context } from "@azure/functions";
import { AzureContextTransport } from "@pagopa/io-functions-commons/dist/src/utils/logging";
import { createTableService } from "azure-storage";
import * as winston from "winston";
import { ServicesAPIClient } from "../clients/services";
import { USER_CGN_COLLECTION_NAME, UserCgnModel } from "../models/user_cgn";
import { getConfigOrThrow } from "../utils/config";
import { cosmosdbClient } from "../utils/cosmosdb";
import { deleteCardExpiration } from "../utils/table_storage";
import { handler } from "./handler";

const config = getConfigOrThrow();

const userCgnsContainer = cosmosdbClient
  .database(config.COSMOSDB_CGN_DATABASE_NAME)
  .container(USER_CGN_COLLECTION_NAME);

const userCgnModel = new UserCgnModel(userCgnsContainer);

const tableService = createTableService(config.CGN_STORAGE_CONNECTION_STRING);

const deleteCgnExpiration = deleteCardExpiration(tableService, config.CGN_EXPIRATION_TABLE_NAME);

// eslint-disable-next-line functional/no-let
let logger: Context["log"] | undefined;
const contextTransport = new AzureContextTransport(() => logger, {
  level: "debug"
});
winston.add(contextTransport);

export const index: AzureFunction = handler(userCgnModel, ServicesAPIClient, deleteCgnExpiration);

export default index;
