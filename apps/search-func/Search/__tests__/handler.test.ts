/* tslint:disable: no-any */
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { SearchRequest } from "../../generated/definitions/SearchRequest";
import { Search, SearchHandler } from "../handler";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";

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

const anExpectedEmptyListResponse = {
  items: []
};

const queryMock = jest.fn().mockImplementation((_, __) => {
  return new Promise(resolve => {
    resolve(aMerchantsList);
  });
});

const cgnOperatorDbMock = { query: queryMock };

const searchRequestBody = {
  token: "abc"
} as SearchRequest;

describe("SearchHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an empty list when no parameter is passed", async () => {
    const response = await SearchHandler(cgnOperatorDbMock as any)(
      {} as any,
      {} as SearchRequest
    );
    expect(queryMock).not.toBeCalled();
    expect(response.kind).toBe("IResponseSuccessJson");
    if (response.kind === "IResponseSuccessJson") {
      expect(response.value).toEqual(anExpectedEmptyListResponse);
    }
  });

  it("should return an empty list when token is less than 3 chars", async () => {
    const response = await SearchHandler(cgnOperatorDbMock as any)({} as any, {
      ...searchRequestBody,
      token: "ab" as NonEmptyString
    });
    expect(queryMock).not.toBeCalled();
    expect(response.kind).toBe("IResponseSuccessJson");
    if (response.kind === "IResponseSuccessJson") {
      expect(response.value).toEqual(anExpectedEmptyListResponse);
    }
  });

  it("should add to the db query the merchant name filter, lowering its case", async () => {
    queryMock.mockImplementationOnce((query, params) => {
      expect(query).toMatch(/AND \(searchable_name LIKE/);
      expect(params.replacements.token_filter).toBe("%abc%");
      return anEmptyArrayPromise;
    });

    const response = await SearchHandler(cgnOperatorDbMock as any)(
      {} as any,
      searchRequestBody
    );
    expect(queryMock).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseSuccessJson");
  });

  it("should add to the db query the pagination parameters", async () => {
    queryMock.mockImplementationOnce((query, _) => {
      expect(query).toMatch(/LIMIT 10\nOFFSET 20$/);
      return anEmptyArrayPromise;
    });

    const response = await SearchHandler(cgnOperatorDbMock as any)({} as any, {
      ...searchRequestBody,
      page: 2 as NonNegativeInteger,
      pageSize: 10
    });
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

    const response = await SearchHandler(cgnOperatorDbMock as any)(
      {} as any,
      searchRequestBody
    );
    expect(queryMock).toBeCalledTimes(1);
    expect(response.kind).toBe("IResponseErrorInternal");
  });
});
