import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/Option";
import {
  aUserEycaCard,
  aUserEycaCardActivated,
  aUserEycaCardExpired,
  cardExpiredMessageMock,
  context,
  enqueueMessageMock,
  eycaFindLastVersionByModelIdMock,
  eycaUpsertModelMock,
  queueStorageMock,
  userEycaCardModelMock
} from "../../__mocks__/mock";
import { handler } from "../handler";
import { setTelemetryClient } from "../../utils/appinsights";
import { telemetryClientMock } from "../../__mocks__/mock";

setTelemetryClient(telemetryClientMock);

// mock return values for this test
eycaFindLastVersionByModelIdMock.mockReturnValue(
  TE.right(
    O.some({
      ...aUserEycaCard,
      card: aUserEycaCardActivated
    })
  )
);

describe("EycaExpired_2_ProcessExpiredEycaQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw when query to cosmos fails", async () => {
    eycaFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.left({ kind: "COSMOS_ERROR" })
    );

    const promised = handler(userEycaCardModelMock, queueStorageMock)(
      context,
      cardExpiredMessageMock
    );

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot query cosmos EYCA")
    );

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).not.toBeCalled();
    expect(enqueueMessageMock).not.toBeCalled();
  });

  it("should throw when upsert to cosmos fails", async () => {
    eycaUpsertModelMock.mockReturnValueOnce(TE.left({ kind: "COSMOS_ERROR" }));

    const promised = handler(userEycaCardModelMock, queueStorageMock)(
      context,
      cardExpiredMessageMock
    );

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot upsert cosmos EYCA")
    );

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).toBeCalledTimes(1);
    expect(enqueueMessageMock).not.toBeCalled();
  });

  it("should throw when enqueue message fails", async () => {
    enqueueMessageMock.mockReturnValueOnce(TE.left(new Error("error")));

    const promised = handler(userEycaCardModelMock, queueStorageMock)(
      context,
      cardExpiredMessageMock
    );

    await expect(promised).rejects.toStrictEqual(new Error("error"));

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).toBeCalledTimes(1);
    expect(enqueueMessageMock).toBeCalledTimes(1);
  });

  it("should succeed when no eyca exists", async () => {
    eycaFindLastVersionByModelIdMock.mockReturnValueOnce(TE.right(O.none));

    const promised = handler(userEycaCardModelMock, queueStorageMock)(
      context,
      cardExpiredMessageMock
    );

    await expect(promised).resolves.toStrictEqual(true);

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).not.toHaveBeenCalled();
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  });

  it("should succeed when eyca is already expired", async () => {
    eycaFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.right(
        O.some({
          ...aUserEycaCard,
          card: aUserEycaCardExpired
        })
      )
    );

    const promised = handler(userEycaCardModelMock, queueStorageMock)(
      context,
      cardExpiredMessageMock
    );

    await expect(promised).resolves.toStrictEqual(true);

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).not.toHaveBeenCalled();
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  });

  it("should succeed when eyca expires successfully", async () => {
    const promised = handler(userEycaCardModelMock, queueStorageMock)(
      context,
      cardExpiredMessageMock
    );

    await expect(promised).resolves.toStrictEqual(true);

    expect(eycaFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(eycaUpsertModelMock).toBeCalledTimes(1);
    expect(enqueueMessageMock).toBeCalledTimes(1);
  });
});
