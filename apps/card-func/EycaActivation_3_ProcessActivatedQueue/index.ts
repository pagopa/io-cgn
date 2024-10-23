import { AzureFunction, Context } from "@azure/functions";
import { AzureContextTransport } from "@pagopa/io-functions-commons/dist/src/utils/logging";
import * as winston from "winston";
import { EycaAPIClient } from "../clients/eyca";
import {
  USER_EYCA_CARD_COLLECTION_NAME,
  UserEycaCardModel
} from "../models/user_eyca_card";
import { getConfigOrThrow } from "../utils/config";
import { cosmosdbClient } from "../utils/cosmosdb";
import { RedisClientFactory } from "../utils/redis";
import { handler } from "./handler";
import { updateCard, UpdateCcdbEycaCard } from "../utils/eyca";
import { QueueStorage } from "../utils/queue";

const config = getConfigOrThrow();

const userEycaCardsContainer = cosmosdbClient
  .database(config.COSMOSDB_CGN_DATABASE_NAME)
  .container(USER_EYCA_CARD_COLLECTION_NAME);

const userEycaCardModel = new UserEycaCardModel(userEycaCardsContainer);

const redisClientFactory = new RedisClientFactory(config);

const eycaClient = EycaAPIClient(config.EYCA_API_BASE_URL);

const updateCcdbEycaCard: UpdateCcdbEycaCard = updateCard(
  redisClientFactory,
  eycaClient,
  config.EYCA_API_USERNAME,
  config.EYCA_API_PASSWORD
);

const queueStorage: QueueStorage = new QueueStorage(config);

// eslint-disable-next-line functional/no-let
let logger: Context["log"] | undefined;
const contextTransport = new AzureContextTransport(() => logger, {
  level: "debug"
});
winston.add(contextTransport);

export const index: AzureFunction = handler(
         userEycaCardModel,
         updateCcdbEycaCard,
         queueStorage
       );

export default index;
