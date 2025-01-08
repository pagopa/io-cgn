import { Context } from "@azure/functions";
import { MessageContent } from "@pagopa/io-functions-commons/dist/generated/definitions/MessageContent";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { MessageToSendMessage } from "../types/queue-message";
import { throwError, trackError } from "../utils/errors";
import { getMessage } from "../utils/messages";
import {
  GetProfileT,
  SendMessageT,
  makeNewMessage,
} from "../utils/notifications";

/**
 * Check get profile status and return message content if profile can get message
 * @param messageToSendMessage
 * @returns
 */
const checkGetProfileStatusAndGetMessage =
  (messageToSendMessage: MessageToSendMessage) =>
  (getProfileStatus: number): TE.TaskEither<Error, O.Option<MessageContent>> =>
    getProfileStatus === 200
      ? // if profile exists we get message content
        TE.of(
          O.some(
            getMessage(
              messageToSendMessage.message_type,
              messageToSendMessage.card,
            ),
          ),
        )
      : getProfileStatus === 404
        ? // if profile does not exist we do not get anything
          TE.of(O.none)
        : // if some error occurs we return left
          TE.left(new Error("Check profile internal error"));

/**
 * Check send message status
 * @param sendMessageStatus
 * @returns
 */
const checkSendMessageStatus = (
  sendMessageStatus: number,
): TE.TaskEither<Error, boolean> =>
  sendMessageStatus === 201
    ? TE.of(true)
    : TE.left(new Error("Send message internal error"));

export const handler =
  (getProfile: GetProfileT, sendMessage: SendMessageT) =>
  (
    context: Context,
    messageToSendMessage: MessageToSendMessage,
  ): Promise<boolean> =>
    pipe(
      TE.tryCatch(
        () => getProfile(messageToSendMessage.fiscal_code),
        E.toError,
      ),
      TE.chain(checkGetProfileStatusAndGetMessage(messageToSendMessage)),
      TE.chainW(
        O.fold(
          () => TE.of(true),
          (messageContent) =>
            pipe(
              // if we have the content it means check profile succeeded
              // and we send the message
              TE.tryCatch(
                () =>
                  sendMessage(
                    messageToSendMessage.fiscal_code,
                    makeNewMessage(messageContent),
                  ),
                E.toError,
              ),
              TE.chain(checkSendMessageStatus),
            ),
        ),
      ),
      TE.mapLeft(trackError(context, `SendMessage_ProcessMessagesQueue`)),
      TE.mapLeft(throwError),
      TE.toUnion,
    )();
