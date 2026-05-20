import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { Ulid } from "@pagopa/ts-commons/lib/strings";
import { ulid } from "ulid";

import {
  aCGNUneligibleFiscalCode,
  aFiscalCode,
  aUserCardActivated,
  aUserCardExpired,
  aUserCgn,
  aUserEycaCard,
  aUserEycaCardActivated,
  aUserEycaCardPending,
  cgnFindLastVersionByModelIdMock,
  cgnUpsertModelMock,
  context,
  enqueueMessageMock,
  eycaFindLastVersionByModelIdMock,
  eycaUpsertModelMock,
  telemetryClientMock,
  userCgnModelMock,
  userEycaCardModelMock,
} from "../../__mocks__/mock";
import { setTelemetryClient } from "../../utils/appinsights";
import { handler } from "../handler";

const DEFAULT_CGN_UPPER_BOUND_AGE = 36 as NonNegativeInteger;
const DEFAULT_EYCA_UPPER_BOUND_AGE = 31 as NonNegativeInteger;

setTelemetryClient(telemetryClientMock);

describe("CardsExpirationRemediation_2_ProcessQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cgnFindLastVersionByModelIdMock.mockReset();
    cgnFindLastVersionByModelIdMock.mockImplementation(() => TE.right(O.none));
    eycaFindLastVersionByModelIdMock.mockReset();
    eycaFindLastVersionByModelIdMock.mockImplementation(() => TE.right(O.none));
    cgnUpsertModelMock.mockReset();
    cgnUpsertModelMock.mockImplementation(() =>
      TE.of({ ...aUserCgn, card: aUserCardActivated }),
    );
    eycaUpsertModelMock.mockReset();
    eycaUpsertModelMock.mockImplementation(() =>
      TE.of({ ...aUserEycaCard, card: aUserEycaCardActivated }),
    );
  });

  it("should expire both activated cards when the citizen is no longer eligible", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(
        O.some({
          ...aUserCgn,
          fiscalCode: aCGNUneligibleFiscalCode,
          card: aUserCardActivated,
        }),
      ),
    );

    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(
        O.some({
          ...aUserEycaCard,
          fiscalCode: aCGNUneligibleFiscalCode,
          card: aUserEycaCardActivated,
        }),
      ),
    );

    const processExpirationRemediation = handler(
      userCgnModelMock,
      userEycaCardModelMock,
      DEFAULT_CGN_UPPER_BOUND_AGE,
      DEFAULT_EYCA_UPPER_BOUND_AGE,
    );

    const result = await processExpirationRemediation(
      {
        fiscal_code: aCGNUneligibleFiscalCode,
        request_id: ulid() as Ulid,
      },
      context,
    );

    expect(result).toBe(true);
    expect(cgnUpsertModelMock).toHaveBeenCalledTimes(1);
    expect(eycaUpsertModelMock).toHaveBeenCalledTimes(1);
    expect(cgnUpsertModelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        card: expect.objectContaining({
          status: "EXPIRED",
        }),
      }),
    );
    expect(eycaUpsertModelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        card: expect.objectContaining({
          status: "EXPIRED",
        }),
      }),
    );
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  });

  it("should ignore eligible citizens even if cards are activated", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(
        O.some({
          ...aUserCgn,
          card: aUserCardActivated,
        }),
      ),
    );

    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(
        O.some({
          ...aUserEycaCard,
          card: aUserEycaCardActivated,
        }),
      ),
    );

    const processExpirationRemediation = handler(
      userCgnModelMock,
      userEycaCardModelMock,
      DEFAULT_CGN_UPPER_BOUND_AGE,
      DEFAULT_EYCA_UPPER_BOUND_AGE,
    );

    const result = await processExpirationRemediation(
      {
        fiscal_code: aFiscalCode,
        request_id: ulid() as Ulid,
      },
      context,
    );

    expect(result).toBe(true);
    expect(cgnUpsertModelMock).not.toHaveBeenCalled();
    expect(eycaUpsertModelMock).not.toHaveBeenCalled();
  });

  it("should ignore cards that are already expired or not activated", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(
        O.some({
          ...aUserCgn,
          fiscalCode: aCGNUneligibleFiscalCode,
          card: aUserCardExpired,
        }),
      ),
    );

    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(
        O.some({
          ...aUserEycaCard,
          fiscalCode: aCGNUneligibleFiscalCode,
          card: aUserEycaCardPending,
        }),
      ),
    );

    const processExpirationRemediation = handler(
      userCgnModelMock,
      userEycaCardModelMock,
      DEFAULT_CGN_UPPER_BOUND_AGE,
      DEFAULT_EYCA_UPPER_BOUND_AGE,
    );

    const result = await processExpirationRemediation(
      {
        fiscal_code: aCGNUneligibleFiscalCode,
        request_id: ulid() as Ulid,
      },
      context,
    );

    expect(result).toBe(true);
    expect(cgnUpsertModelMock).not.toHaveBeenCalled();
    expect(eycaUpsertModelMock).not.toHaveBeenCalled();
  });

  it("should fail when a technical error occurs while querying cosmos", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.left({ kind: "COSMOS_ERROR" }),
    );

    const processExpirationRemediation = handler(
      userCgnModelMock,
      userEycaCardModelMock,
      DEFAULT_CGN_UPPER_BOUND_AGE,
      DEFAULT_EYCA_UPPER_BOUND_AGE,
    );

    await expect(
      processExpirationRemediation(
        {
          fiscal_code: aCGNUneligibleFiscalCode,
          request_id: ulid() as Ulid,
        },
        context,
      ),
    ).rejects.toThrow("Cannot query cosmos CGN");
  });
});