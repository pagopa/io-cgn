import { createTableService } from "azure-storage";
import { getConfigOrThrow } from "../utils/config";
import { QueueStorage } from "../utils/queue";
import { getUpdateExpiredCgnHandler } from "./handler";

const config = getConfigOrThrow();

const tableService = createTableService(config.CGN_STORAGE_CONNECTION_STRING);

const queueStorage: QueueStorage = new QueueStorage(config);

const updateExpiredCgnHandler = getUpdateExpiredCgnHandler(
  tableService,
  config.CGN_EXPIRATION_TABLE_NAME,
  queueStorage
);

export default updateExpiredCgnHandler;
