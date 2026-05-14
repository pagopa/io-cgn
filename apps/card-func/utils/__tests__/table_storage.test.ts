// eslint-disable @typescript-eslint/no-explicit-any

import { RestError } from "@azure/data-tables";
import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { deleteCardExpiration, insertCardExpiration } from "../table_storage";
import { aFiscalCode, now } from "../../__mocks__/mock";

const deleteEntityMock = jest.fn().mockResolvedValue(undefined);
const upsertEntityMock = jest.fn().mockResolvedValue(undefined);

const tableClientMock = {
  deleteEntity: deleteEntityMock,
  upsertEntity: upsertEntityMock,
} as any;

beforeEach(() => {
  jest.clearAllMocks();
  deleteEntityMock.mockResolvedValue(undefined);
  upsertEntityMock.mockResolvedValue(undefined);
});

describe("deleteCardExpiration", () => {
  it("should succeed if deleteEntity resolves", async () => {
    const result = await deleteCardExpiration(tableClientMock)(
      aFiscalCode,
      now,
    )();
    expect(E.isRight(result)).toBe(true);
  });

  it("should succeed (not error) if entity is not found (404)", async () => {
    const notFoundError = new RestError("Not Found", {
      statusCode: 404,
      code: "ResourceNotFound",
    });
    deleteEntityMock.mockRejectedValueOnce(notFoundError);
    const result = await deleteCardExpiration(tableClientMock)(
      aFiscalCode,
      now,
    )();
    expect(E.isRight(result)).toBe(true);
  });

  it("should return an error if deleteEntity throws a non-404 error", async () => {
    deleteEntityMock.mockRejectedValueOnce(new Error("Cannot delete tuple"));
    const result = await deleteCardExpiration(tableClientMock)(
      aFiscalCode,
      now,
    )();
    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left).toBeDefined();
    }
  });
});

describe("insertCardExpiration", () => {
  it("should succeed if upsertEntity resolves", async () => {
    const result = await insertCardExpiration(tableClientMock)(
      aFiscalCode,
      now,
      now,
    )();
    expect(E.isRight(result)).toBe(true);
  });

  it("should return an error if upsertEntity throws", async () => {
    upsertEntityMock.mockRejectedValueOnce(new Error("Cannot insert entity"));
    const result = await insertCardExpiration(tableClientMock)(
      aFiscalCode,
      now,
      now,
    )();
    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left).toBeDefined();
    }
  });
});
