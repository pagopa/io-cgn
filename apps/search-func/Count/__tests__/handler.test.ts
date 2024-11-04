import { Context } from "@azure/functions";
import { CountHandler } from "../handler";

const contextMock = {} as Context;

const aCountMock = { count: 10 };

const anExpectedResponse = aCountMock;

const queryMock = jest.fn().mockImplementation((_, __) => {
  return new Promise(resolve => {
    resolve([aCountMock]);
  });
});

const cgnOperatorDbMock = { query: queryMock };

describe("CountHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the result when everything is ok", async () => {
    const response = await CountHandler(cgnOperatorDbMock as any)(contextMock);
    expect(queryMock).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseSuccessJson");
    if (response.kind === "IResponseSuccessJson") {
      expect(response.value).toEqual(anExpectedResponse);
    }
  });

  it("should return an InternalServerError when there is an issue quering the db", async () => {
    queryMock.mockImplementationOnce(
      (_, __) =>
        new Promise(resolve => {
          throw Error("fail to connect to db");
        })
    );

    const response = await CountHandler(cgnOperatorDbMock as any)(contextMock);
    expect(queryMock).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseErrorInternal");
  });
});
