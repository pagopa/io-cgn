import { app, output } from "@azure/functions";
import { HealthFunction } from "./functions/health";
import { CosmosClient } from "@azure/cosmos";
import { getConfigOrThrow } from "./utils/config";
import { cosmosdbClient } from "./utils/cosmosdb";

const config = getConfigOrThrow();

const cosmosClient = cosmosdbClient;

app.http("healthCheck", {
  authLevel: "anonymous",
  handler: HealthFunction({
    cosmosClient
  }),
  methods: ["GET"],
  route: "health",
});