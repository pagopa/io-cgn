/**
 * Use a singleton CosmosDB client across functions.
 */
import { CosmosClient } from "@azure/cosmos";

let cosmosDbClientInstance: CosmosClient;

export const getCosmosDbClientInstance = (dbUri: string, dbKey?: string) => {
  if (!cosmosDbClientInstance) {
    cosmosDbClientInstance = new CosmosClient({
      endpoint: dbUri,
      key: dbKey,
    });
  }
  return cosmosDbClientInstance;
};
