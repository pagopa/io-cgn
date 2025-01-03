import {
  createTableService,
  ExponentialRetryPolicyFilter
} from "azure-storage";
import { getConfigOrThrow } from "../utils/config";
import { getUpdateExpiredEycaHandler } from "./handler";
import { QueueStorage } from "../utils/queue";
import { getExpiredCardUsers } from "../utils/card_expiration";
import initTelemetryClient from "../utils/appinsights";

const config = getConfigOrThrow();

initTelemetryClient();

const tableService = createTableService(config.CGN_STORAGE_CONNECTION_STRING);

const getExpiredCardUsersFunction = getExpiredCardUsers(
  // using custom Exponential backoff retry policy for expired card's query operation
  tableService.withFilter(new ExponentialRetryPolicyFilter(5)),
  config.EYCA_EXPIRATION_TABLE_NAME
);

const queueStorage: QueueStorage = new QueueStorage(config);

const updateExpiredEycaHandler = getUpdateExpiredEycaHandler(
  getExpiredCardUsersFunction,
  queueStorage
);

export default updateExpiredEycaHandler;
