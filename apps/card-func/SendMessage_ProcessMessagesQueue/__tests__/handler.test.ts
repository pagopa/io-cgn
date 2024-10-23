import { MessageContent } from "@pagopa/io-functions-commons/dist/generated/definitions/MessageContent";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { aFiscalCode, aUserCardActivated, context } from "../../__mocks__/mock";
import { handler } from "../handler";
import { MessageToSendMessage } from "../../types/queue-message";
import { getMessage, MessageTypeEnum } from "../../utils/messages";

const messageOkStatusCode = 201;
const profileOkStatusCode = 200;
const profileNotFoundStatusCode = 404;
const profileQueryExceptionStatusCode = 500;
const profileQueryFailureStatusCode = 300; // any code
const messageQueryExceptionStatusCode = 500;
const messageQueryFailureStatusCode = 300; //  any code

const mockGetProfile = jest.fn(async () => profileOkStatusCode);
const mockSendMessage = jest.fn(async () => messageOkStatusCode);

const aMessageToSendMessageMock: MessageToSendMessage = {
  fiscal_code: aFiscalCode,
  message_type: MessageTypeEnum.CARD_ACTIVATED,
  card: aUserCardActivated
};

describe("SendMessageHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fail when getProfile fails", async () => {
    mockGetProfile.mockReturnValueOnce(
      Promise.resolve(profileQueryFailureStatusCode)
    );

    const promised = handler(mockGetProfile, mockSendMessage)(
      context,
      aMessageToSendMessageMock
    );

    await expect(promised).rejects.toStrictEqual(
      new Error("Check profile internal error")
    );

    expect(mockGetProfile).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("should fail when sendMessage fails", async () => {
    mockSendMessage.mockReturnValueOnce(
      Promise.resolve(messageQueryExceptionStatusCode)
    );

    const promised = handler(mockGetProfile, mockSendMessage)(
      context,
      aMessageToSendMessageMock
    );

    await expect(promised).rejects.toStrictEqual(
      new Error("Send message internal error")
    );

    expect(mockGetProfile).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  it("should succeeed when no profile is found", async () => {
    mockGetProfile.mockReturnValueOnce(
      Promise.resolve(profileNotFoundStatusCode)
    );

    const promised = handler(mockGetProfile, mockSendMessage)(
      context,
      aMessageToSendMessageMock
    );

    await expect(promised).resolves.toStrictEqual(true);

    expect(mockGetProfile).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("should succeeed when profile is found and message is sent", async () => {
    const promised = handler(mockGetProfile, mockSendMessage)(
      context,
      aMessageToSendMessageMock
    );

    await expect(promised).resolves.toStrictEqual(true);

    expect(mockGetProfile).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      aFiscalCode,
      expect.objectContaining({
        content: getMessage(MessageTypeEnum.CARD_ACTIVATED, aUserCardActivated)
      })
    );
  });
});
