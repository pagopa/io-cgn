/* eslint-disable @typescript-eslint/no-explicit-any */

import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import {
  aFiscalCode,
  aUserCardActivated,
  aUserCardPending,
  aUserCgn,
  cgnFindLastVersionByModelIdMock,
  context,
  userCgnModelMock
} from "../../__mocks__/mock";
import {
  StatusEnum
} from "../../generated/definitions/CgnActivationDetail";
import { GetCgnActivationHandler } from "../handler";

const handler = GetCgnActivationHandler(userCgnModelMock);

describe("GetCgnActivationHandler", () => {
  it("should return an internal error if there are errors to retrieve a UserCgn", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.left({ kind: "COSMOS_ERROR" })
    );

    const response = await handler(context, aFiscalCode);

    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return Not found if UserCgn is missing", async () => {
    const response = await handler(context, aFiscalCode);

    expect(response.kind).toBe("IResponseErrorNotFound");
  });

  it("should return success with COMPLETED status if userCgn is already activated", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.right(O.some({ ...aUserCgn, card: aUserCardActivated }))
    );

    const response = await handler(context, aFiscalCode);

    expect(response.kind).toBe("IResponseSuccessJson");
    if (response.kind == "IResponseSuccessJson") {
      expect(response.value).toMatchObject(
        expect.objectContaining({ status: StatusEnum.COMPLETED })
      );
    }
  });

  it("should return success with PENDING status if userCgn is PENDING", async () => {
    cgnFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.right(O.some({ ...aUserCgn, card: aUserCardPending }))
    );

    const response = await handler(context, aFiscalCode);

    expect(response.kind).toBe("IResponseSuccessJson");
    if (response.kind == "IResponseSuccessJson") {
      expect(response.value).toMatchObject(
        expect.objectContaining({ status: StatusEnum.PENDING })
      );
    }
  });
});
