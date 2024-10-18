import { createTableService } from "azure-storage";
import { getConfigOrThrow } from "../utils/config";
import { getUpdateExpiredEycaHandler } from "./handler";
import { QueueStorage } from "../utils/queue";

const config = getConfigOrThrow();

const tableService = createTableService(config.CGN_STORAGE_CONNECTION_STRING);

const queueStorage: QueueStorage = new QueueStorage(config);

const updateExpiredEycaHandler = getUpdateExpiredEycaHandler(
  tableService,
  config.EYCA_EXPIRATION_TABLE_NAME,
  queueStorage
);

export default updateExpiredEycaHandler;
