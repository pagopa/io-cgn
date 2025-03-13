/* eslint-disable @typescript-eslint/no-explicit-any */

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { GetUserInfoHandler } from "../handler";
import { setTelemetryClient } from "../../utils/appinsights";
import {
  aUserCardActivated,
  aUserCardExpired,
  aUserCardPending,
  aUserCardPendingDelete,
  aUserCardRevoked,
  aUserCgn,
  aUserEycaCard,
  aUserEycaCardActivated,
  aUserEycaCardExpired,
  aUserEycaCardPending,
  aUserEycaCardPendingDelete,
  aUserEycaCardRevoked,
  cgnFindLastVersionByModelIdMock,
  eycaFindLastVersionByModelIdMock,
  telemetryClientMock,
  userCgnModelMock,
  userEycaCardModelMock,
} from "../../__mocks__/mock";

setTelemetryClient(telemetryClientMock);

const aFiscalCode = "RODFDS82S10H501T" as FiscalCode;

describe("GetUserInfoHandler", () => {
  it("should return an internal error when a CGN query error occurs", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.left(new Error("Query Error")),
    );
    const handler = GetUserInfoHandler(userCgnModelMock, userEycaCardModelMock);
    const response = await handler({} as any, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return an internal error when an EYCA query error occurs", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserCgn, card: aUserCardPending })),
    );
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.left(new Error("Query Error")),
    );
    const handler = GetUserInfoHandler(userCgnModelMock, userEycaCardModelMock);
    const response = await handler({} as any, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return not found if no userCgn is found", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() => TE.of(O.none));
    const handler = GetUserInfoHandler(userCgnModelMock, userEycaCardModelMock);
    const response = await handler({} as any, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorNotFound");
  });

  /**
   * WITHOUT EYCA
   */
  it("should return user info with only pending cgn if no eyca is present", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserCgn, card: aUserCardPending })),
    );
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.none),
    );
    const handler = GetUserInfoHandler(userCgnModelMock, userEycaCardModelMock);
    const response = await handler({} as any, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessJson");
  });

  it("should return user info with only activated cgn if no eyca is present", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserCgn, card: aUserCardActivated })),
    );
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.none),
    );
    const handler = GetUserInfoHandler(userCgnModelMock, userEycaCardModelMock);
    const response = await handler({} as any, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessJson");
  });

  it("should return user info with only expired cgn if no eyca is present", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserCgn, card: aUserCardExpired })),
    );
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.none),
    );
    const handler = GetUserInfoHandler(userCgnModelMock, userEycaCardModelMock);
    const response = await handler({} as any, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessJson");
  });

  it("should return user info with only pending delete cgn if no eyca is present", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserCgn, card: aUserCardPendingDelete })),
    );
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.none),
    );
    const handler = GetUserInfoHandler(userCgnModelMock, userEycaCardModelMock);
    const response = await handler({} as any, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessJson");
  });

  it("should return user info with only revoked cgn if no eyca is present", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserCgn, card: aUserCardRevoked })),
    );
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.none),
    );
    const handler = GetUserInfoHandler(userCgnModelMock, userEycaCardModelMock);
    const response = await handler({} as any, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessJson");
  });

  /**
   * WITH EYCA
   */
  it("should return user info with pending cgn and pending eyca", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserCgn, card: aUserCardPending })),
    );
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({...aUserEycaCard, card: aUserEycaCardPending})),
    );
    const handler = GetUserInfoHandler(userCgnModelMock, userEycaCardModelMock);
    const response = await handler({} as any, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessJson");
  });

  it("should return user info with activated cgn and activated eyca", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserCgn, card: aUserCardActivated })),
    );
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserEycaCard, card: aUserEycaCardActivated })),
    );
    const handler = GetUserInfoHandler(userCgnModelMock, userEycaCardModelMock);
    const response = await handler({} as any, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessJson");
  });

  it("should return user info with expired cgn and expired eyca", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserCgn, card: aUserCardExpired })),
    );
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserEycaCard, card: aUserEycaCardExpired })),
    );
    const handler = GetUserInfoHandler(userCgnModelMock, userEycaCardModelMock);
    const response = await handler({} as any, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessJson");
  });

  it("should return user info with pending delete cgn and pending delete eyca", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserCgn, card: aUserCardPendingDelete })),
    );
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserEycaCard, card: aUserEycaCardPendingDelete })),
    );
    const handler = GetUserInfoHandler(userCgnModelMock, userEycaCardModelMock);
    const response = await handler({} as any, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessJson");
  });

  it("should return user info with revoked cgn and revoked eyca", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserCgn, card: aUserCardRevoked })),
    );
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.of(O.some({ ...aUserEycaCard, card: aUserEycaCardRevoked })),
    );
    const handler = GetUserInfoHandler(userCgnModelMock, userEycaCardModelMock);
    const response = await handler({} as any, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessJson");
  });
});
