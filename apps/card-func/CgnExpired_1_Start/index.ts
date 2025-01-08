import {
  ExponentialRetryPolicyFilter,
  createTableService,
} from "azure-storage";

import initTelemetryClient from "../utils/appinsights";
import { getExpiredCardUsers } from "../utils/card_expiration";
import { getConfigOrThrow } from "../utils/config";
import { QueueStorage } from "../utils/queue";
import { getUpdateExpiredCgnHandler } from "./handler";

const config = getConfigOrThrow();

initTelemetryClient();

const tableService = createTableService(config.CGN_STORAGE_CONNECTION_STRING);

const getExpiredCardUsersFunction = getExpiredCardUsers(
  // using custom Exponential backoff retry policy for expired card's query operation
  tableService.withFilter(new ExponentialRetryPolicyFilter(5)),
  config.CGN_EXPIRATION_TABLE_NAME,
);

const queueStorage: QueueStorage = new QueueStorage(config);

const updateExpiredCgnHandler = getUpdateExpiredCgnHandler(
  getExpiredCardUsersFunction,
  queueStorage,
);

export default updateExpiredCgnHandler;
