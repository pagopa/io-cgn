import { getMaterializedViewRefreshHandler } from "../handler";
import { setTelemetryClient } from "../../utils/appinsights";
import { telemetryClientMock } from "../../__mocks__/mocks";

setTelemetryClient(telemetryClientMock);

const queryMock = jest.fn().mockImplementation((query, __) => {
  expect(query).toBe(
    "REFRESH MATERIALIZED VIEW CONCURRENTLY online_merchant; REFRESH MATERIALIZED VIEW CONCURRENTLY offline_merchant; REFRESH MATERIALIZED VIEW CONCURRENTLY merchant; REFRESH MATERIALIZED VIEW CONCURRENTLY published_product_category"
  );

  return new Promise(resolve => {
    resolve([]);
  });
});

const cgnOperatorDbMock = { query: queryMock };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getMaterializedViewRefreshHandler", () => {
  it("should refresh the materialized views", async () => {
    const response = await getMaterializedViewRefreshHandler(
      cgnOperatorDbMock as any
    )({} as any);

    expect(queryMock).toBeCalledTimes(1);
    expect(response).toEqual(true);
  });

  it("should report an error if there is an issue with the db", async () => {
    queryMock.mockRejectedValueOnce("cannot connect to db");

    const response = await getMaterializedViewRefreshHandler(
      cgnOperatorDbMock as any
    )({} as any);

    expect(queryMock).toBeCalledTimes(1);
    expect(response).toEqual(false);
  });
});
