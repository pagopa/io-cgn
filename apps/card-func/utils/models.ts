import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  ResponseErrorInternal,
  ResponseErrorNotFound,
} from "@pagopa/ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { QueueClient } from "@azure/storage-queue";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { UserCgn, UserCgnModel } from "../models/user_cgn";
import { UserEycaCard, UserEycaCardModel } from "../models/user_eyca_card";

export const retrieveUserCgn = (
  userCgnModel: UserCgnModel,
  fiscalCode: FiscalCode,
): TE.TaskEither<IResponseErrorInternal | IResponseErrorNotFound, UserCgn> =>
  pipe(
    userCgnModel.findLastVersionByModelId([fiscalCode]),
    TE.mapLeft(() =>
      ResponseErrorInternal("Error trying to retrieve user's CGN status"),
    ),
    TE.chainW(
      TE.fromOption(() =>
        ResponseErrorNotFound("Not Found", "User's CGN status not found"),
      ),
    ),
  );

export const retrieveUserEycaCard = (
  userEycaCardModel: UserEycaCardModel,
  fiscalCode: FiscalCode,
): TE.TaskEither<
  IResponseErrorInternal | IResponseErrorNotFound,
  UserEycaCard
> =>
  pipe(
    userEycaCardModel.findLastVersionByModelId([fiscalCode]),
    TE.mapLeft(() =>
      ResponseErrorInternal("Error trying to retrieve user's EYCA Card"),
    ),
    TE.chainW(
      TE.fromOption(() =>
        ResponseErrorNotFound("Not Found", "User's EYCA Card not found"),
      ),
    ),
  );

/**
 * Enqueue an EYCA activation's process
 */
export const getEnqueueEycaActivation = (
  queueClient: QueueClient,
): ((input: Record<string, string>) => TE.TaskEither<Error, boolean>) => {
  return (input: Record<string, string>): TE.TaskEither<Error, boolean> => {
    // see https://github.com/Azure/Azure-Functions/issues/1091
    const message = Buffer.from(JSON.stringify(input)).toString("base64");
    return TE.tryCatch(async () => {
      await queueClient.createIfNotExists();
      await queueClient.sendMessage(message);
      return true;
    }, (e) => e instanceof Error ? e : new Error(String(e)));
  };
};

export type EnqueueEycaActivationT = ReturnType<
  typeof getEnqueueEycaActivation
>;
