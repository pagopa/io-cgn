import * as TE from "fp-ts/lib/TaskEither";

import {
  aFiscalCode,
  context,
  enqueueMessageMock,
  queueStorageMock,
  telemetryClientMock,
} from "../../__mocks__/mock";
import { StartCardsRecoveryHandler } from "../handler";
import { setTelemetryClient } from "../../utils/appinsights";

setTelemetryClient(telemetryClientMock);

describe("StartCardsRecovery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return Accepted if the recovery message is enqueued", async () => {
    const startCardsRecoveryHandler = StartCardsRecoveryHandler(queueStorageMock);

    const response = await startCardsRecoveryHandler(context, {
      fiscal_code: aFiscalCode,
    });

    expect(response.kind).toBe("IResponseSuccessAccepted");
    expect(enqueueMessageMock).toHaveBeenCalledTimes(1);
    expect(enqueueMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fiscal_code: aFiscalCode,
        request_id: expect.any(String),
      }),
    );
  });

  it("should return Internal Error if the recovery queue is not reachable", async () => {
    enqueueMessageMock.mockImplementationOnce(() => TE.left(new Error("any error")));

    const startCardsRecoveryHandler = StartCardsRecoveryHandler(queueStorageMock);

    const response = await startCardsRecoveryHandler(context, {
      fiscal_code: aFiscalCode,
    });

    expect(response.kind).toBe("IResponseErrorInternal");
    expect(enqueueMessageMock).toHaveBeenCalledTimes(1);
  });
});