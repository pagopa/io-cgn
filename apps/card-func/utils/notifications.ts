import { MessageContent } from "@pagopa/io-functions-commons/dist/generated/definitions/MessageContent";
import { NewMessage } from "@pagopa/io-functions-commons/dist/generated/definitions/NewMessage";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import { ServicesAPIClient } from "../clients/services";
import { MessagesAPIClient } from "../clients/services-messages";

export const makeNewMessage = (content: MessageContent): NewMessage =>
  pipe(
    NewMessage.decode({
      content,
    }),
    E.getOrElseW((errs) => {
      throw new Error("Invalid MessageContent: " + readableReport(errs));
    }),
  );

/**
 * Get the user profile that matches the provided fiscal code
 * using the IO Notification API (REST).
 * Returns the status of the response.
 */
export const GetProfile =
  (servicesAPIClient: ServicesAPIClient) =>
  async (fiscalCode: FiscalCode): Promise<number> => {
    const status = pipe(
      await servicesAPIClient.getProfileByPOST({
        payload: { fiscal_code: fiscalCode },
      }),
      E.fold(
        (err) => {
          throw new Error(
            "GetProfile validation error: " + readableReport(err),
          );
        },
        (res) => res.status,
      ),
    );

    return status;
  };

export type GetProfile = ReturnType<typeof GetProfile>;

/**
 * Send a message to the user that matches the provided fiscal code
 * using the IO Notification API (REST).
 */
export const SendMessage =
  (messagesAPIClient: MessagesAPIClient) =>
  async (fiscalCode: FiscalCode, newMessage: NewMessage): Promise<number> => {
    const status = pipe(
      await messagesAPIClient.submitMessageforUserWithFiscalCodeInBody({
        message: { ...newMessage, fiscal_code: fiscalCode },
      }),
      E.fold(
        (err) => {
          throw new Error(
            "SendMessage validation error: " + readableReport(err),
          );
        },
        (res) => res.status,
      ),
    );
    return status;
  };

export type SendMessage = ReturnType<typeof SendMessage>;
