import { Context } from "@azure/functions";
import { CountHandler } from "../handler";
import { setTelemetryClient } from "../../utils/appinsights";
import { telemetryClientMock } from "../../__mocks__/mocks";

const contextMock = {} as Context;

const aCountMock = { count: 10 };

const anExpectedResponse = aCountMock;

const queryMock = jest.fn().mockResolvedValue([aCountMock]);

const cgnOperatorDbMock = { query: queryMock };

setTelemetryClient(telemetryClientMock);

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
    queryMock.mockRejectedValueOnce("Cannot connect to DB");

    const response = await CountHandler(cgnOperatorDbMock as any)(contextMock);
    expect(queryMock).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseErrorInternal");
    expect(telemetryClientMock.trackException).toBeCalledTimes(1);
  });
});
