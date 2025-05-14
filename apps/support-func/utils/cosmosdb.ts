/**
 * Use a singleton CosmosDB client across functions.
 */
import { CosmosClient } from "@azure/cosmos";

import { getConfigOrThrow } from "./config";

const config = getConfigOrThrow();
const cosmosDbUri = config.COSMOSDB_CGN_URI;
const masterKey = config.COSMOSDB_CGN_KEY;

let cosmosDbClientInstance: CosmosClient;

export const getCosmosDbClientInstance = () => {
  if (!cosmosDbClientInstance) {
    cosmosDbClientInstance = new CosmosClient({
      endpoint: cosmosDbUri,
      key: masterKey,
    });
  }
  return cosmosDbClientInstance;
};
