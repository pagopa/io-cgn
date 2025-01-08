import { AzureFunction } from "@azure/functions";
import { createTableService } from "azure-storage";

import { EycaAPIClient } from "../clients/eyca";
import {
  USER_EYCA_CARD_COLLECTION_NAME,
  UserEycaCardModel,
} from "../models/user_eyca_card";
import initTelemetryClient from "../utils/appinsights";
import { getConfigOrThrow } from "../utils/config";
import { cosmosdbClient } from "../utils/cosmosdb";
import { PreIssueEycaCard, preIssueCard } from "../utils/eyca";
import { QueueStorage } from "../utils/queue";
import { getRedisClientFactory } from "../utils/redis";
import { insertCardExpiration } from "../utils/table_storage";
import { handler } from "./handler";

const config = getConfigOrThrow();

initTelemetryClient();

const userEycaCardsContainer = cosmosdbClient
  .database(config.COSMOSDB_CGN_DATABASE_NAME)
  .container(USER_EYCA_CARD_COLLECTION_NAME);

const userEycaCardModel = new UserEycaCardModel(userEycaCardsContainer);

const tableService = createTableService(config.CGN_STORAGE_CONNECTION_STRING);

const storeEycaExpiration = insertCardExpiration(
  tableService,
  config.EYCA_EXPIRATION_TABLE_NAME,
);

const redisClientFactory = getRedisClientFactory(config);

const eycaClient = EycaAPIClient(config.EYCA_API_BASE_URL);

const preIssueEycaCard: PreIssueEycaCard = preIssueCard(
  redisClientFactory,
  eycaClient,
  config.EYCA_API_USERNAME,
  config.EYCA_API_PASSWORD,
);

const queueStorage: QueueStorage = new QueueStorage(config);

export const index: AzureFunction = handler(
  userEycaCardModel,
  storeEycaExpiration,
  preIssueEycaCard,
  queueStorage,
);

export default index;
