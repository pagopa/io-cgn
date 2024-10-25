/* eslint-disable @typescript-eslint/no-explicit-any */
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import {
  aFiscalCode,
  aUserEycaCard,
  aUserEycaCardActivated,
  aUserEycaCardPending,
  context,
  eycaFindLastVersionByModelIdMock,
  userEycaCardModelMock
} from "../../__mocks__/mock";
import { StatusEnum } from "../../generated/definitions/CgnActivationDetail";
import { GetEycaActivationHandler } from "../handler";

const handler = GetEycaActivationHandler(userEycaCardModelMock);

describe("GetEycaActivationHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an internal error if there are errors to retrieve a UserEycaCard", async () => {
    eycaFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.left({ kind: "COSMOS_ERROR" })
    );

    const response = await handler(context, aFiscalCode);

    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return Not found if infos about UserEycaCard are missing", async () => {
    const response = await handler(context, aFiscalCode);

    expect(response.kind).toBe("IResponseErrorNotFound");
  });

  it("should return success with COMPLETED status if UserEycaCard is already activated", async () => {
    eycaFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.right(O.some({ ...aUserEycaCard, card: aUserEycaCardActivated }))
    );

    const response = await handler(context, aFiscalCode);

    expect(response.kind).toBe("IResponseSuccessJson");
    if (response.kind == "IResponseSuccessJson") {
      expect(response.value).toMatchObject(
        expect.objectContaining({ status: StatusEnum.COMPLETED })
      );
    }
  });

  it("should return success with PENDING status if UserEycaCard is PENDING", async () => {
    eycaFindLastVersionByModelIdMock.mockReturnValueOnce(
      TE.right(O.some({ ...aUserEycaCard, card: aUserEycaCardPending }))
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
