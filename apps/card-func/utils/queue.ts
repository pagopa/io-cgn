import { QueueService } from "azure-storage";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { IConfig } from "./config";
import {
  CardActivatedMessage,
  CardExpiredMessage,
  CardPendingDeleteMessage,
  CardPendingMessage,
  MessageToSendMessage
} from "../types/queue-message";
import { toBase64 } from "./base64";

export class QueueStorage {
  config: IConfig;
  queueService: QueueService;

  constructor(config: IConfig) {
    this.config = config;
    this.queueService = new QueueService(
      this.config.CGN_STORAGE_CONNECTION_STRING
    );
  }

  createQueue = (queueName: string) =>
    TE.tryCatch(
      () =>
        new Promise<boolean>((resolve, reject) =>
          this.queueService.createQueueIfNotExists(
            queueName,
            (error: Error) => {
              error ? reject(error) : resolve(true);
            }
          )
        ),
      E.toError
    );

  createMessage = (queueName: string, message: string) =>
    TE.tryCatch(
      async () =>
        new Promise<boolean>((resolve, reject) =>
          this.queueService.createMessage(
            queueName,
            message,
            (error: Error) => {
              error ? reject(error) : resolve(true);
            }
          )
        ),
      E.toError
    );

  enqueueMessage = (queueName: string, message: string) =>
    pipe(
      this.createQueue(queueName),
      TE.chain(_ => this.createMessage(queueName, message))
    );

  enqueuePendingCGNMessage = (message: CardPendingMessage) =>
    this.enqueueMessage(this.config.PENDING_CGN_QUEUE_NAME, toBase64(message));

  enqueueActivatedCGNMessage = (message: CardActivatedMessage) =>
    this.enqueueMessage(
      this.config.ACTIVATED_CGN_QUEUE_NAME,
      toBase64(message)
    );

  enqueuePendingEYCAMessage = (message: CardPendingMessage) =>
    this.enqueueMessage(this.config.PENDING_EYCA_QUEUE_NAME, toBase64(message));

  enqueueActivatedEYCAMessage = (message: CardActivatedMessage) =>
    this.enqueueMessage(
      this.config.ACTIVATED_EYCA_QUEUE_NAME,
      toBase64(message)
    );

  enqueuePendingDeleteCGNMessage = (message: CardPendingDeleteMessage) =>
    this.enqueueMessage(
      this.config.PENDING_DELETE_CGN_QUEUE_NAME,
      toBase64(message)
    );

  enqueuePendingDeleteEYCAMessage = (message: CardPendingDeleteMessage) =>
    this.enqueueMessage(
      this.config.PENDING_DELETE_EYCA_QUEUE_NAME,
      toBase64(message)
    );

  enqueueExpiredCGNMessage = (message: CardExpiredMessage) =>
    this.enqueueMessage(this.config.EXPIRED_CGN_QUEUE_NAME, toBase64(message));

  enqueueExpiredEYCAMessage = (message: CardExpiredMessage) =>
    this.enqueueMessage(this.config.EXPIRED_EYCA_QUEUE_NAME, toBase64(message));

  enqueueMessageToSendMessage = (message: MessageToSendMessage) =>
    this.enqueueMessage(this.config.MESSAGES_QUEUE_NAME, toBase64(message));
}
