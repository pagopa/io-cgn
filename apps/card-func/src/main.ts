/**
 * Azure Functions v4 entry point — src/main.ts
 *
 * This file replaces all per-function index.ts entry points.
 * It initialises all shared dependencies and registers every function.
 */

import { app } from "@azure/functions";
import {
  ExponentialRetryPolicyFilter,
  createTableService,
} from "azure-storage";

import { EycaAPIClient } from "../clients/eyca";
import { ServicesAPIClient } from "../clients/services";
import { MessagesAPIClient } from "../clients/services-messages";
import { USER_CGN_COLLECTION_NAME, UserCgnModel } from "../models/user_cgn";
import {
  USER_EYCA_CARD_COLLECTION_NAME,
  UserEycaCardModel,
} from "../models/user_eyca_card";
import initTelemetryClient from "../utils/appinsights";
import { getExpiredCardUsers } from "../utils/card_expiration";
import { getConfigOrThrow } from "../utils/config";
import { cosmosdbClient } from "../utils/cosmosdb";
import {
  DeleteEycaCard,
  PreIssueEycaCard,
  UpdateCcdbEycaCard,
  deleteCard,
  preIssueCard,
  updateCard,
} from "../utils/eyca";
import { GetProfile, SendMessage } from "../utils/notifications";
import { QueueStorage } from "../utils/queue";
import { getRedisClientFactory } from "../utils/redis";
import {
  deleteCardExpiration,
  insertCardExpiration,
} from "../utils/table_storage";

// ---------------------------------------------------------------------------
// IMPORT HANDLERS
// ---------------------------------------------------------------------------
import { StartCardsDelete } from "../CardsDelete_1_Start/handler";
import { handler as processDeleteCgnHandler } from "../CardsDelete_2_ProcessPendingDeleteCgnQueue/handler";
import { handler as processDeleteEycaHandler } from "../CardsDelete_3_ProcessPendingDeleteEycaQueue/handler";
import { StartCgnActivation } from "../CgnActivation_1_Start/handler";
import { StartCgnActivation as StartCgnActivationExternal } from "../CgnActivation_1_Start_External/handler";
import { handler as processPendingCgnHandler } from "../CgnActivation_2_ProcessPendingQueue/handler";
import { handler as processActivatedCgnHandler } from "../CgnActivation_3_ProcessActivatedQueue/handler";
import { getUpdateExpiredCgnHandler } from "../CgnExpired_1_Start/handler";
import { handler as processExpiredCgnHandler } from "../CgnExpired_2_ProcessExpiredCgnQueue/handler";
import { StartEycaActivation } from "../EycaActivation_1_Start/handler";
import { handler as processPendingEycaHandler } from "../EycaActivation_2_ProcessPendingQueue/handler";
import { handler as processActivatedEycaHandler } from "../EycaActivation_3_ProcessActivatedQueue/handler";
import { getUpdateExpiredEycaHandler } from "../EycaExpired_1_Start/handler";
import { handler as processExpiredEycaHandler } from "../EycaExpired_2_ProcessExpiredEycaQueue/handler";
import { GetGenerateOtp } from "../GenerateOtp/handler";
import { GetCgnActivation } from "../GetCgnActivation/handler";
import { GetCgnStatus } from "../GetCgnStatus/handler";
import { GetEycaActivation } from "../GetEycaActivation/handler";
import { GetEycaStatus } from "../GetEycaStatus/handler";
import { Info } from "../Health/handler";
import { handler as sendMessageHandler } from "../SendMessage_ProcessMessagesQueue/handler";
import { UpsertCgnStatus } from "../UpsertCgnStatus/handler";

// ---------------------------------------------------------------------------
// CONFIG SETUP
// ---------------------------------------------------------------------------
const config = getConfigOrThrow();

initTelemetryClient();

// ---------------------------------------------------------------------------
// DEPENDENCY INITIALISATION
// ---------------------------------------------------------------------------

// CosmosDB containers
const userCgnsContainer = cosmosdbClient
  .database(config.COSMOSDB_CGN_DATABASE_NAME)
  .container(USER_CGN_COLLECTION_NAME);

const userCgnModel = new UserCgnModel(userCgnsContainer);

const userEycaCardsContainer = cosmosdbClient
  .database(config.COSMOSDB_CGN_DATABASE_NAME)
  .container(USER_EYCA_CARD_COLLECTION_NAME);

const userEycaCardModel = new UserEycaCardModel(userEycaCardsContainer);

// Queue Storage
const queueStorage: QueueStorage = new QueueStorage(config);

// Table Storage
const tableService = createTableService(config.CGN_STORAGE_CONNECTION_STRING);

const storeCgnExpiration = insertCardExpiration(
  tableService,
  config.CGN_EXPIRATION_TABLE_NAME,
);

const storeEycaExpiration = insertCardExpiration(
  tableService,
  config.EYCA_EXPIRATION_TABLE_NAME,
);

const deleteCgnExpiration = deleteCardExpiration(
  tableService,
  config.CGN_EXPIRATION_TABLE_NAME,
);

const deleteEycaExpiration = deleteCardExpiration(
  tableService,
  config.EYCA_EXPIRATION_TABLE_NAME,
);

// Redis
const redisClientFactory = getRedisClientFactory(config);

// EYCA API Client
const eycaClient = EycaAPIClient(config.EYCA_API_BASE_URL);

const preIssueEycaCard: PreIssueEycaCard = preIssueCard(
  redisClientFactory,
  eycaClient,
  config.EYCA_API_USERNAME,
  config.EYCA_API_PASSWORD,
);

const updateCcdbEycaCard: UpdateCcdbEycaCard = updateCard(
  redisClientFactory,
  eycaClient,
  config.EYCA_API_USERNAME,
  config.EYCA_API_PASSWORD,
);

const deleteEycaCard: DeleteEycaCard = deleteCard(
  redisClientFactory,
  eycaClient,
  config.EYCA_API_USERNAME,
  config.EYCA_API_PASSWORD,
);

// Expired card queries (with exponential retry)
const getExpiredCgnCardUsersFunction = getExpiredCardUsers(
  tableService.withFilter(new ExponentialRetryPolicyFilter(5)),
  config.CGN_EXPIRATION_TABLE_NAME,
);

const getExpiredEycaCardUsersFunction = getExpiredCardUsers(
  tableService.withFilter(new ExponentialRetryPolicyFilter(5)),
  config.EYCA_EXPIRATION_TABLE_NAME,
);

// ---------------------------------------------------------------------------
// HTTP TRIGGERS
// ---------------------------------------------------------------------------

app.http("Health", {
  authLevel: "anonymous",
  handler: Info(),
  methods: ["GET"],
  route: "api/v1/cgn/health",
});

app.http("CardsDelete_1_Start", {
  authLevel: "function",
  handler: StartCardsDelete(userCgnModel, userEycaCardModel, queueStorage),
  methods: ["POST"],
  route: "api/v1/cgn/{fiscalcode}/delete",
});

app.http("CgnActivation_1_Start", {
  authLevel: "function",
  handler: StartCgnActivation(
    userCgnModel,
    config.CGN_UPPER_BOUND_AGE,
    queueStorage,
  ),
  methods: ["POST"],
  route: "api/v1/cgn/{fiscalcode}/activation",
});

app.http("CgnActivation_1_Start_External", {
  authLevel: "function",
  handler: StartCgnActivationExternal(
    ServicesAPIClient,
    userCgnModel,
    config.CGN_UPPER_BOUND_AGE,
    queueStorage,
  ),
  methods: ["POST"],
  route: "api/v1/cgn/activation",
});

app.http("EycaActivation_1_Start", {
  authLevel: "function",
  handler: StartEycaActivation(
    userEycaCardModel,
    config.EYCA_UPPER_BOUND_AGE,
    queueStorage,
  ),
  methods: ["POST"],
  route: "api/v1/cgn/{fiscalcode}/eyca/activation",
});

app.http("GenerateOtp", {
  authLevel: "function",
  handler: GetGenerateOtp(
    userCgnModel,
    redisClientFactory,
    config.OTP_TTL_IN_SECONDS,
  ),
  methods: ["POST"],
  route: "api/v1/cgn/otp/{fiscalcode}",
});

app.http("GetCgnActivation", {
  authLevel: "function",
  handler: GetCgnActivation(userCgnModel),
  methods: ["GET"],
  route: "api/v1/cgn/{fiscalcode}/activation",
});

app.http("GetCgnStatus", {
  authLevel: "function",
  handler: GetCgnStatus(userCgnModel),
  methods: ["GET"],
  route: "api/v1/cgn/status/{fiscalcode}",
});

app.http("GetEycaActivation", {
  authLevel: "function",
  handler: GetEycaActivation(userEycaCardModel),
  methods: ["GET"],
  route: "api/v1/cgn/{fiscalcode}/eyca/activation",
});

app.http("GetEycaStatus", {
  authLevel: "function",
  handler: GetEycaStatus(
    userEycaCardModel,
    userCgnModel,
    config.EYCA_UPPER_BOUND_AGE,
  ),
  methods: ["GET"],
  route: "api/v1/cgn/eyca/status/{fiscalcode}",
});

app.http("UpsertCgnStatus", {
  authLevel: "function",
  handler: UpsertCgnStatus(userCgnModel),
  methods: ["POST"],
  route: "api/v1/cgn/{fiscalcode}/status",
});

// ---------------------------------------------------------------------------
// QUEUE TRIGGERS
// ---------------------------------------------------------------------------

app.storageQueue("CardsDelete_2_ProcessPendingDeleteCgnQueue", {
  connection: "CGN_STORAGE_CONNECTION_STRING",
  handler: processDeleteCgnHandler(
    userCgnModel,
    ServicesAPIClient,
    deleteCgnExpiration,
  ),
  queueName: "%PENDING_DELETE_CGN_QUEUE_NAME%",
});

app.storageQueue("CardsDelete_3_ProcessPendingDeleteEycaQueue", {
  connection: "CGN_STORAGE_CONNECTION_STRING",
  handler: processDeleteEycaHandler(
    userEycaCardModel,
    deleteEycaExpiration,
    deleteEycaCard,
  ),
  queueName: "%PENDING_DELETE_EYCA_QUEUE_NAME%",
});

app.storageQueue("CgnActivation_2_ProcessPendingQueue", {
  connection: "CGN_STORAGE_CONNECTION_STRING",
  handler: processPendingCgnHandler(
    userCgnModel,
    ServicesAPIClient,
    storeCgnExpiration,
    queueStorage,
  ),
  queueName: "%PENDING_CGN_QUEUE_NAME%",
});

app.storageQueue("CgnActivation_3_ProcessActivatedQueue", {
  connection: "CGN_STORAGE_CONNECTION_STRING",
  handler: processActivatedCgnHandler(
    userCgnModel,
    ServicesAPIClient,
    queueStorage,
    config.EYCA_UPPER_BOUND_AGE,
  ),
  queueName: "%ACTIVATED_CGN_QUEUE_NAME%",
});

app.storageQueue("CgnExpired_2_ProcessExpiredCgnQueue", {
  connection: "CGN_STORAGE_CONNECTION_STRING",
  handler: processExpiredCgnHandler(userCgnModel, queueStorage),
  queueName: "%EXPIRED_CGN_QUEUE_NAME%",
});

app.storageQueue("EycaActivation_2_ProcessPendingQueue", {
  connection: "CGN_STORAGE_CONNECTION_STRING",
  handler: processPendingEycaHandler(
    userEycaCardModel,
    storeEycaExpiration,
    preIssueEycaCard,
    queueStorage,
  ),
  queueName: "%PENDING_EYCA_QUEUE_NAME%",
});

app.storageQueue("EycaActivation_3_ProcessActivatedQueue", {
  connection: "CGN_STORAGE_CONNECTION_STRING",
  handler: processActivatedEycaHandler(
    userEycaCardModel,
    updateCcdbEycaCard,
    queueStorage,
  ),
  queueName: "%ACTIVATED_EYCA_QUEUE_NAME%",
});

app.storageQueue("EycaExpired_2_ProcessExpiredEycaQueue", {
  connection: "CGN_STORAGE_CONNECTION_STRING",
  handler: processExpiredEycaHandler(userEycaCardModel, queueStorage),
  queueName: "%EXPIRED_EYCA_QUEUE_NAME%",
});

app.storageQueue("SendMessage_ProcessMessagesQueue", {
  connection: "CGN_STORAGE_CONNECTION_STRING",
  handler: sendMessageHandler(
    GetProfile(ServicesAPIClient),
    SendMessage(MessagesAPIClient),
  ),
  queueName: "%MESSAGES_QUEUE_NAME%",
});

// ---------------------------------------------------------------------------
// TIMER TRIGGERS
// ---------------------------------------------------------------------------

app.timer("CgnExpired_1_Start", {
  handler: getUpdateExpiredCgnHandler(
    getExpiredCgnCardUsersFunction,
    queueStorage,
  ),
  schedule: "0 0 2 * * *",
});

app.timer("EycaExpired_1_Start", {
  handler: getUpdateExpiredEycaHandler(
    getExpiredEycaCardUsersFunction,
    queueStorage,
  ),
  schedule: "0 0 2 * * *",
});
