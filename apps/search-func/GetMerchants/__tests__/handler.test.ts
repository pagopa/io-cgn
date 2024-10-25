/* tslint:disable: no-any */
import { MerchantSearchRequest } from "../../generated/definitions/MerchantSearchRequest";
import { GetMerchantsHandler } from "../handler";

const anEmptyArrayPromise = new Promise(resolve => {
  resolve([]);
});

const aMerchant = {
  id: "agreement_1",
  name: "PagoPa",
  description: "PagoPa description",
  new_discounts: true
};

const aMerchantsList = [aMerchant];

const aMerchantSearchItem = {
  id: aMerchant.id,
  name: aMerchant.name,
  description: aMerchant.description,
  newDiscounts: true
};

const anExpectedResponse = {
  items: [aMerchantSearchItem]
};

const queryMock = jest.fn().mockImplementation((_, __) => {
  return new Promise(resolve => {
    resolve(aMerchantsList);
  });
});

const cgnOperatorDbMock = { query: queryMock };

const searchRequestBody = {};

describe("GetOnlineMerchantsHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the result when no parameter is passed", async () => {
    const response = await GetMerchantsHandler(cgnOperatorDbMock as any)(
      {} as any,
      searchRequestBody as MerchantSearchRequest
    );
    expect(queryMock).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseSuccessJson");
    if (response.kind === "IResponseSuccessJson") {
      expect(response.value).toEqual(anExpectedResponse);
    }
  });

  it("should add to the db query the merchant name filter, lowering its case", async () => {
    queryMock.mockImplementationOnce((query, params) => {
      expect(query).toMatch(/AND searchable_name LIKE/);
      expect(params.replacements.token_filter).toBe("%a company%");
      return anEmptyArrayPromise;
    });

    const response = await GetMerchantsHandler(cgnOperatorDbMock as any)(
      {} as any,
      { token: "A Company" } as MerchantSearchRequest
    );
    expect(queryMock).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseSuccessJson");
  });

  it("should add to the db query the pagination parameters", async () => {
    queryMock.mockImplementationOnce((query, _) => {
      expect(query).toMatch(/LIMIT 10\nOFFSET 20$/);

      return anEmptyArrayPromise;
    });

    const response = await GetMerchantsHandler(cgnOperatorDbMock as any)(
      {} as any,
      { page: 2, pageSize: 10 } as MerchantSearchRequest
    );
    expect(queryMock).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseSuccessJson");
  });

  it("should return an InternalServerError when there is an issue quering the db", async () => {
    queryMock.mockImplementationOnce(
      (_, __) =>
        new Promise(resolve => {
          throw Error("fail to connect to db");
        })
    );

    const response = await GetMerchantsHandler(cgnOperatorDbMock as any)(
      {} as any,
      { page: 0, pageSize: 20 } as MerchantSearchRequest
    );
    expect(queryMock).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseErrorInternal");
  });
});
