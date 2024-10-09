import { QueueService } from "azure-storage";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { IConfig } from "./config";

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

  enqueuePendingCGNMessage = (message: string) =>
    this.enqueueMessage(this.config.PENDING_CGN_QUEUE_NAME, message);

  enqueueActivatedCGNMessage = (message: string) =>
    this.enqueueMessage(this.config.ACTIVATED_CGN_QUEUE_NAME, message);
}
