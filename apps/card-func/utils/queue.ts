import { QueueClient, QueueServiceClient } from "@azure/storage-queue";
import { DefaultAzureCredential } from "@azure/identity";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import {
  CardActivatedMessage,
  CardExpiredMessage,
  CardPendingDeleteMessage,
  CardPendingMessage,
  MessageToSendMessage,
} from "../types/queue-message";
import { toBase64 } from "./base64";
import { IConfig } from "./config";

const getQueueServiceClient = (accountName: string): QueueServiceClient =>
  new QueueServiceClient(
    `https://${accountName}.queue.core.windows.net`,
    new DefaultAzureCredential(),
  );

export class QueueStorage {
  config: IConfig;
  queueServiceClient: QueueServiceClient;

  constructor(config: IConfig) {
    this.config = config;
    this.queueServiceClient = getQueueServiceClient(
      config.CGN_STORAGE_ACCOUNT_NAME,
    );
  }

  private getQueueClient = (queueName: string): QueueClient =>
    this.queueServiceClient.getQueueClient(queueName);

  createMessage = (queueName: string, message: string) =>
    TE.tryCatch(async () => {
      const queueClient = this.getQueueClient(queueName);
      await queueClient.createIfNotExists();
      await queueClient.sendMessage(message);
      return true;
    }, E.toError);

  enqueueActivatedCGNMessage = (message: CardActivatedMessage) =>
    this.createMessage(this.config.ACTIVATED_CGN_QUEUE_NAME, toBase64(message));

  enqueueActivatedEYCAMessage = (message: CardActivatedMessage) =>
    this.createMessage(
      this.config.ACTIVATED_EYCA_QUEUE_NAME,
      toBase64(message),
    );

  enqueueExpiredCGNMessage = (message: CardExpiredMessage) =>
    this.createMessage(this.config.EXPIRED_CGN_QUEUE_NAME, toBase64(message));

  enqueueExpiredEYCAMessage = (message: CardExpiredMessage) =>
    this.createMessage(this.config.EXPIRED_EYCA_QUEUE_NAME, toBase64(message));

  enqueueMessageToSendMessage = (message: MessageToSendMessage) =>
    this.createMessage(this.config.MESSAGES_QUEUE_NAME, toBase64(message));

  enqueuePendingCGNMessage = (message: CardPendingMessage) =>
    this.createMessage(this.config.PENDING_CGN_QUEUE_NAME, toBase64(message));

  enqueuePendingDeleteCGNMessage = (message: CardPendingDeleteMessage) =>
    this.createMessage(
      this.config.PENDING_DELETE_CGN_QUEUE_NAME,
      toBase64(message),
    );

  enqueuePendingDeleteEYCAMessage = (message: CardPendingDeleteMessage) =>
    this.createMessage(
      this.config.PENDING_DELETE_EYCA_QUEUE_NAME,
      toBase64(message),
    );

  enqueuePendingEYCAMessage = (message: CardPendingMessage) =>
    this.createMessage(this.config.PENDING_EYCA_QUEUE_NAME, toBase64(message));
}
