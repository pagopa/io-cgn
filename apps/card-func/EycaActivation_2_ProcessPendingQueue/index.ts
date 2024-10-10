import { AzureFunction, Context } from "@azure/functions";
import { AzureContextTransport } from "@pagopa/io-functions-commons/dist/src/utils/logging";
import { createTableService } from "azure-storage";
import * as winston from "winston";
import { EycaAPIClient } from "../clients/eyca";
import {
  USER_EYCA_CARD_COLLECTION_NAME,
  UserEycaCardModel
} from "../models/user_eyca_card";
import { getConfigOrThrow } from "../utils/config";
import { cosmosdbClient } from "../utils/cosmosdb";
import { QueueStorage } from "../utils/queue";
import { RedisClientFactory } from "../utils/redis";
import { insertCardExpiration } from "../utils/table_storage";
import { handler } from "./handler";
import { preIssueCard, PreIssueEycaCard } from "../utils/eyca";
import * as TE from "fp-ts/lib/TaskEither";
import { CcdbNumber } from "../generated/definitions/CcdbNumber";

const config = getConfigOrThrow();

const userEycaCardsContainer = cosmosdbClient
  .database(config.COSMOSDB_CGN_DATABASE_NAME)
  .container(USER_EYCA_CARD_COLLECTION_NAME);

const userEycaCardModel = new UserEycaCardModel(userEycaCardsContainer);

const tableService = createTableService(config.CGN_STORAGE_CONNECTION_STRING);

const storeEycaExpiration = insertCardExpiration(
  tableService,
  config.EYCA_EXPIRATION_TABLE_NAME
);

const redisClientFactory = new RedisClientFactory(config);

const eycaClient = EycaAPIClient(config.EYCA_API_BASE_URL);

const preIssueEycaCard: PreIssueEycaCard = preIssueCard(
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
  storeEycaExpiration,
  preIssueEycaCard,
  queueStorage
);

export default index;
