import { toCosmosErrorResponse } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/Option";
import {
  aFiscalCode,
  aUserCardActivated,
  aUserCardPending,
  aUserCgn,
  aUserEycaCard,
  aUserEycaCardActivated,
  cgnFindLastVersionByModelIdMock,
  context,
  enqueueMessageMock,
  eycaFindLastVersionByModelIdMock,
  queueStorageMock,
  userCgnModelMock,
  userEycaCardModelMock
} from "../../__mocks__/mock";
import { StartCardsDeleteHandler } from "../handler";
import { InstanceId } from "../../generated/definitions/InstanceId";
import { setTelemetryClient } from "../../utils/appinsights";
import { telemetryClientMock } from "../../__mocks__/mock";

setTelemetryClient(telemetryClientMock);

describe("StartCgnDelete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an Internal Error if an error occurs during UserCgn retrieve", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.left(toCosmosErrorResponse(new Error("query error")))
    );
    const StartCardsDelete = StartCardsDeleteHandler(
      userCgnModelMock,
      userEycaCardModelMock,
      queueStorageMock
    );
    const response = await StartCardsDelete(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorInternal");
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  });

  it("should return an Internal Error if an error occurs during UserEycaCard retrieve", async () => {
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.left(toCosmosErrorResponse(new Error("query error")))
    );
    const StartCardsDelete = StartCardsDeleteHandler(
      userCgnModelMock,
      userEycaCardModelMock,
      queueStorageMock
    );
    const response = await StartCardsDelete(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorInternal");
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  });

  it("should return an Internal Error if UserCgn has no expiration_date", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(O.some({ ...aUserCgn, card: aUserCardPending }))
    );
    const StartCardsDelete = StartCardsDeleteHandler(
      userCgnModelMock,
      userEycaCardModelMock,
      queueStorageMock
    );
    const response = await StartCardsDelete(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorInternal");
    expect(response.detail).toBe(
      "Internal server error: Cannot find user CGN card expiration"
    );
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  });

  it("should return an Internal Error if UserEycaCard has no expiration_date", async () => {
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(O.some({ ...aUserEycaCard, card: aUserCardPending }))
    );
    const StartCardsDelete = StartCardsDeleteHandler(
      userCgnModelMock,
      userEycaCardModelMock,
      queueStorageMock
    );
    const response = await StartCardsDelete(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorInternal");
    expect(response.detail).toBe(
      "Internal server error: Cannot find user EYCA card expiration"
    );
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  });

  it("should return a Redirect to Resource if delete request is accepted because there are both cards", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(O.some({ ...aUserCgn, card: aUserCardActivated }))
    );
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(O.some({ ...aUserEycaCard, card: aUserEycaCardActivated }))
    );

    const StartCardsDelete = StartCardsDeleteHandler(
      userCgnModelMock,
      userEycaCardModelMock,
      queueStorageMock
    );
    const response = await StartCardsDelete(context, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessRedirectToResource");
    if (response.kind === "IResponseSuccessRedirectToResource") {
      expect(InstanceId.is(response.payload)).toBe(true);
    }
    expect(enqueueMessageMock).toHaveBeenCalledTimes(2);
  });

  it("should return a Redirect to Resource if delete request is accepted because there is just cgn card", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(O.some({ ...aUserCgn, card: aUserCardActivated }))
    );

    const StartCardsDelete = StartCardsDeleteHandler(
      userCgnModelMock,
      userEycaCardModelMock,
      queueStorageMock
    );
    const response = await StartCardsDelete(context, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessRedirectToResource");
    if (response.kind === "IResponseSuccessRedirectToResource") {
      expect(InstanceId.is(response.payload)).toBe(true);
    }
    expect(enqueueMessageMock).toHaveBeenCalledTimes(1);
  });

  it("should return a Redirect to Resource if delete request is accepted because there just an eyca card", async () => {
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(O.some({ ...aUserEycaCard, card: aUserEycaCardActivated }))
    );

    const StartCardsDelete = StartCardsDeleteHandler(
      userCgnModelMock,
      userEycaCardModelMock,
      queueStorageMock
    );
    const response = await StartCardsDelete(context, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessRedirectToResource");
    if (response.kind === "IResponseSuccessRedirectToResource") {
      expect(InstanceId.is(response.payload)).toBe(true);
    }
    expect(enqueueMessageMock).toHaveBeenCalledTimes(1);
  });

  it("should return a Redirect to Resource if delete request is accepted because there are no cards", async () => {
    const StartCardsDelete = StartCardsDeleteHandler(
      userCgnModelMock,
      userEycaCardModelMock,
      queueStorageMock
    );
    const response = await StartCardsDelete(context, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessRedirectToResource");
    if (response.kind === "IResponseSuccessRedirectToResource") {
      expect(InstanceId.is(response.payload)).toBe(true);
    }
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  });
});
