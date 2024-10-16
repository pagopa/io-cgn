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
  enqueuePendingDeleteCGNMessageMock,
  enqueuePendingDeleteEYCAMessageMock,
  eycaFindLastVersionByModelIdMock,
  queueStorageMock,
  userCgnModelMock,
  userEycaCardModelMock
} from "../../__mocks__/mock";
import { StartCardsDeleteHandler } from "../handler";

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
    expect(enqueuePendingDeleteCGNMessageMock).not.toHaveBeenCalled();
    expect(enqueuePendingDeleteEYCAMessageMock).not.toHaveBeenCalled();
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
    expect(enqueuePendingDeleteCGNMessageMock).not.toHaveBeenCalled();
    expect(enqueuePendingDeleteEYCAMessageMock).not.toHaveBeenCalled();
  });

  it("should return an Internal Error if UserCgn has no expiration_date", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(O.some({...aUserCgn, card: aUserCardPending}))
    );
    const StartCardsDelete = StartCardsDeleteHandler(
      userCgnModelMock,
      userEycaCardModelMock,
      queueStorageMock
    );
    const response = await StartCardsDelete(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorInternal");
    expect(response.detail).toBe("Internal server error: Cannot find user CGN card expiration");
    expect(enqueuePendingDeleteCGNMessageMock).not.toHaveBeenCalled();
    expect(enqueuePendingDeleteEYCAMessageMock).not.toHaveBeenCalled();
  });

  it("should return an Internal Error if UserEycaCard has no expiration_date", async () => {
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(O.some({...aUserEycaCard, card: aUserCardPending}))
    );
    const StartCardsDelete = StartCardsDeleteHandler(
      userCgnModelMock,
      userEycaCardModelMock,
      queueStorageMock
    );
    const response = await StartCardsDelete(context, aFiscalCode);
    expect(response.kind).toBe("IResponseErrorInternal");
    expect(response.detail).toBe("Internal server error: Cannot find user EYCA card expiration");
    expect(enqueuePendingDeleteCGNMessageMock).not.toHaveBeenCalled();
    expect(enqueuePendingDeleteEYCAMessageMock).not.toHaveBeenCalled();
  });

  it("should return a ResponseSuccessAccepted if delete request is accepted because there are both cards", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(O.some({...aUserCgn, card: aUserCardActivated}))
    );
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(O.some({...aUserEycaCard, card: aUserEycaCardActivated}))
    );

    const StartCardsDelete = StartCardsDeleteHandler(
      userCgnModelMock,
      userEycaCardModelMock,
      queueStorageMock
    );
    const response = await StartCardsDelete(context, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessAccepted");
    expect(enqueuePendingDeleteCGNMessageMock).toHaveBeenCalledTimes(1);
    expect(enqueuePendingDeleteEYCAMessageMock).toHaveBeenCalledTimes(1);
  });

  it("should return a ResponseSuccessAccepted if delete request is accepted because there is just cgn card", async () => {
    cgnFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(O.some({...aUserCgn, card: aUserCardActivated}))
    );

    const StartCardsDelete = StartCardsDeleteHandler(
      userCgnModelMock,
      userEycaCardModelMock,
      queueStorageMock
    );
    const response = await StartCardsDelete(context, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessAccepted");
    expect(enqueuePendingDeleteCGNMessageMock).toHaveBeenCalledTimes(1);
    expect(enqueuePendingDeleteEYCAMessageMock).not.toHaveBeenCalled();
  });

  it("should return a ResponseSuccessAccepted if delete request is accepted because there just an eyca card", async () => {
    eycaFindLastVersionByModelIdMock.mockImplementationOnce(() =>
      TE.right(O.some({...aUserEycaCard, card: aUserEycaCardActivated}))
    );

    const StartCardsDelete = StartCardsDeleteHandler(
      userCgnModelMock,
      userEycaCardModelMock,
      queueStorageMock
    );
    const response = await StartCardsDelete(context, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessAccepted");
    expect(enqueuePendingDeleteCGNMessageMock).not.toHaveBeenCalled();
    expect(enqueuePendingDeleteEYCAMessageMock).toHaveBeenCalledTimes(1);
  });

  it("should return a ResponseSuccessAccepted if delete request is accepted because there are no cards", async () => {
    const StartCardsDelete = StartCardsDeleteHandler(
      userCgnModelMock,
      userEycaCardModelMock,
      queueStorageMock
    );
    const response = await StartCardsDelete(context, aFiscalCode);
    expect(response.kind).toBe("IResponseSuccessAccepted");
    expect(enqueuePendingDeleteCGNMessageMock).not.toHaveBeenCalled();
    expect(enqueuePendingDeleteEYCAMessageMock).not.toHaveBeenCalled();
  });
});
