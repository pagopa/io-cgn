import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import {
  aUserCardActivated,
  aUserCardExpired,
  aUserCgn,
  cardExpiredMessageMock,
  cgnFindLastVersionByModelIdMock,
  cgnUpsertModelMock,
  context,
  enqueueMessageMock,
  queueStorageMock,
  userCgnModelMock
} from "../../__mocks__/mock";
import { handler } from "../handler";

// mock return values for this test
cgnFindLastVersionByModelIdMock.mockReturnValue(
  TE.right(
    O.some({
      ...aUserCgn,
      card: aUserCardActivated
    })
  )
);

describe("CgnExpired_2_ProcessExpiredCgnQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw when query to cosmos fails", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.left({ kind: "COSMOS_ERROR" })
    );

    const promised = handler(userCgnModelMock, queueStorageMock)(
      context,
      cardExpiredMessageMock
    );

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot query cosmos CGN")
    );

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).not.toBeCalled();
    expect(enqueueMessageMock).not.toBeCalled();
  });

  it("should throw when upsert to cosmos fails", async () => {
    cgnUpsertModelMock.mockReturnValueOnce(TE.left({ kind: "COSMOS_ERROR" }));

    const promised = handler(userCgnModelMock, queueStorageMock)(
      context,
      cardExpiredMessageMock
    );

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot upsert cosmos CGN")
    );

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toBeCalledTimes(1);
    expect(enqueueMessageMock).not.toBeCalled();
  });

  it("should throw when enqueue message fails", async () => {
    enqueueMessageMock.mockReturnValueOnce(TE.left(new Error("error")));

    const promised = handler(userCgnModelMock, queueStorageMock)(
      context,
      cardExpiredMessageMock
    );

    await expect(promised).rejects.toStrictEqual(new Error("error"));

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toBeCalledTimes(1);
    expect(enqueueMessageMock).toBeCalledTimes(1);
  });

  it("should succeed when no cgn exists", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValueOnce(TE.right(O.none));

    const promised = handler(userCgnModelMock, queueStorageMock)(
      context,
      cardExpiredMessageMock
    );

    await expect(promised).resolves.toStrictEqual(true);

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).not.toHaveBeenCalled();
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  });

  it("should succeed when cgn is already expired", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.right(
        O.some({
          ...aUserCgn,
          card: aUserCardExpired
        })
      )
    );

    const promised = handler(userCgnModelMock, queueStorageMock)(
      context,
      cardExpiredMessageMock
    );

    await expect(promised).resolves.toStrictEqual(true);

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).not.toHaveBeenCalled();
    expect(enqueueMessageMock).not.toHaveBeenCalled();
  });

  it("should succeed when cgn expires successfully", async () => {
    const promised = handler(userCgnModelMock, queueStorageMock)(
      context,
      cardExpiredMessageMock
    );

    await expect(promised).resolves.toStrictEqual(true);

    expect(cgnFindLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(cgnUpsertModelMock).toBeCalledTimes(1);
    expect(enqueueMessageMock).toBeCalledTimes(1);
  });
});
