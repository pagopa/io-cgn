import { AzureFunction } from "@azure/functions";

import { EycaAPIClient } from "../clients/eyca";
import {
  USER_EYCA_CARD_COLLECTION_NAME,
  UserEycaCardModel,
} from "../models/user_eyca_card";
import initTelemetryClient from "../utils/appinsights";
import { getConfigOrThrow } from "../utils/config";
import { cosmosdbClient } from "../utils/cosmosdb";
import { UpdateCcdbEycaCard, updateCard } from "../utils/eyca";
import { QueueStorage } from "../utils/queue";
import { getRedisClientFactory } from "../utils/redis";
import { handler } from "./handler";

const config = getConfigOrThrow();

initTelemetryClient();

const userEycaCardsContainer = cosmosdbClient
  .database(config.COSMOSDB_CGN_DATABASE_NAME)
  .container(USER_EYCA_CARD_COLLECTION_NAME);

const userEycaCardModel = new UserEycaCardModel(userEycaCardsContainer);

const redisClientFactory = getRedisClientFactory(config);

const eycaClient = EycaAPIClient(config.EYCA_API_BASE_URL);

const updateCcdbEycaCard: UpdateCcdbEycaCard = updateCard(
  redisClientFactory,
  eycaClient,
  config.EYCA_API_USERNAME,
  config.EYCA_API_PASSWORD,
);

const queueStorage: QueueStorage = new QueueStorage(config);

export const index: AzureFunction = handler(
  userEycaCardModel,
  updateCcdbEycaCard,
  queueStorage,
);

export default index;
