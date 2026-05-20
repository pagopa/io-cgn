import * as TE from "fp-ts/lib/TaskEither";

import {
  aFiscalCode,
  context,
  enqueueMessageMock,
  queueStorageMock,
  telemetryClientMock,
} from "../../__mocks__/mock";
import { StartCardsExpirationRemediationHandler } from "../handler";
import { setTelemetryClient } from "../../utils/appinsights";

setTelemetryClient(telemetryClientMock);

describe("StartCardsExpirationRemediation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return Accepted if the expiration remediation message is enqueued", async () => {
    const startCardsExpirationRemediationHandler =
      StartCardsExpirationRemediationHandler(queueStorageMock);

    const response = await startCardsExpirationRemediationHandler(
      context,
      aFiscalCode,
    );

    expect(response.kind).toBe("IResponseSuccessAccepted");
    expect(enqueueMessageMock).toHaveBeenCalledTimes(1);
    expect(enqueueMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fiscal_code: aFiscalCode,
        request_id: expect.any(String),
      }),
    );
  });

  it("should return Internal Error if the remediation queue is not reachable", async () => {
    enqueueMessageMock.mockImplementationOnce(() => TE.left(new Error("any error")));

    const startCardsExpirationRemediationHandler =
      StartCardsExpirationRemediationHandler(queueStorageMock);

    const response = await startCardsExpirationRemediationHandler(
      context,
      aFiscalCode,
    );

    expect(response.kind).toBe("IResponseErrorInternal");
    expect(enqueueMessageMock).toHaveBeenCalledTimes(1);
  });
});