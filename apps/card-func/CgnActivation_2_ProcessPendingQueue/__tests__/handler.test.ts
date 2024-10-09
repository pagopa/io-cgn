import { Context } from "@azure/functions";
import {
  HttpStatusCodeEnum,
  ResponseErrorGeneric,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import {
  FiscalCode,
  NonEmptyString,
  Ulid
} from "@pagopa/ts-commons/lib/strings";
import { addYears } from "date-fns";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { ulid } from "ulid";
import {
  StatusEnum as ActivatedStatusEnum,
  CardActivated
} from "../../generated/definitions/CardActivated";
import {
  CardPending,
  StatusEnum as PendingStatusEnum
} from "../../generated/definitions/CardPending";
import { ActivationStatusEnum } from "../../generated/services-api/ActivationStatus";
import { UserCgnModel } from "../../models/user_cgn";
import { toBase64 } from "../../utils/base64";
import { QueueStorage } from "../../utils/queue";
import { handler } from "../handler";
import { createClient } from "../../generated/services-api/client";
import { TableService } from "azure-storage";

const aFiscalCode = "RODFDS99S10H501T" as FiscalCode;

const queueMessage: string = toBase64({
  request_id: ulid() as Ulid,
  fiscal_code: aFiscalCode,
  activation_date: new Date(),
  expiration_date: new Date(),
  status: PendingStatusEnum.PENDING
});

const context = ({
  log: {
    error: jest.fn().mockImplementation(e => {
      console.log(e);
    })
  }
} as unknown) as Context;

const makeResponse = (status: HttpStatusCodeEnum, value: string) => ({
  status,
  value,
  headers: []
});

const aUserCardActivated: CardActivated = {
  activation_date: new Date(),
  expiration_date: addYears(new Date(), 2),
  status: ActivatedStatusEnum.ACTIVATED
};

const aUserCardPending: CardPending = {
  status: PendingStatusEnum.PENDING
};

// mock user cgn model
const findLastVersionByModelIdMock = jest
  .fn()
  .mockImplementation(() => TE.right(O.none));

const upsertModelMock = jest.fn().mockImplementation(() =>
  TE.of({
    fiscalCode: aFiscalCode,
    id: "A_USER_CGN_ID" as NonEmptyString,
    card: aUserCardPending
  })
);

const userCgnModelMock = ({
  findLastVersionByModelId: findLastVersionByModelIdMock,
  upsert: upsertModelMock
} as unknown) as UserCgnModel;

// mock services api client
const upsertServiceActivationMock = jest.fn().mockImplementation(() =>
  E.right(
    makeResponse(
      HttpStatusCodeEnum.HTTP_STATUS_200,
      JSON.stringify({
        service_id: "qwertyuiop",
        fiscal_code: aFiscalCode,
        status: ActivationStatusEnum.PENDING,
        version: 1
      })
    )
  )
);

const fakeServicesAPIClient = createClient<"SubscriptionKey">({
  baseUrl: "",
  fetchApi: async () => new Response(),
  withDefaults: op => params => op({ SubscriptionKey: "", ...params })
});

const servicesClientMock = {
  ...fakeServicesAPIClient,
  upsertServiceActivation: upsertServiceActivationMock
};

// mock storage
const storeCgnExpirationMock = jest
  .fn()
  .mockImplementation(() =>
    TE.right(({} as unknown) as TableService.EntityMetadata)
  );

// mock queue storage
const enqueueActivatedCGNMessageMock = jest
  .fn()
  .mockReturnValue(TE.right(true));

const queueStorageMock = ({
  enqueueActivatedCGNMessage: enqueueActivatedCGNMessageMock
} as unknown) as QueueStorage;

describe("ProcessActivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw when query to cosmos fails", async () => {
    findLastVersionByModelIdMock.mockReturnValueOnce(
      TE.left({ kind: "COSMOS_ERROR" })
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot query cosmos CGN")
    );

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).not.toHaveBeenCalled();
    expect(upsertServiceActivationMock).not.toHaveBeenCalled();
    expect(storeCgnExpirationMock).not.toHaveBeenCalled();
    expect(enqueueActivatedCGNMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when upsert to cosmos fails", async () => {
    upsertModelMock.mockReturnValueOnce(TE.left({ kind: "COSMOS_ERROR" }));

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).rejects.toStrictEqual(
      new Error("COSMOS_ERROR|Cannot upsert cosmos CGN")
    );

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).not.toHaveBeenCalled();
    expect(storeCgnExpirationMock).not.toHaveBeenCalled();
    expect(enqueueActivatedCGNMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when special service upsert throws", async () => {
    upsertServiceActivationMock.mockImplementationOnce(() => {
      throw "Error";
    });

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCgnExpirationMock).not.toHaveBeenCalled();
    expect(enqueueActivatedCGNMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when special service upsert returns non success response", async () => {
    upsertServiceActivationMock.mockImplementationOnce(() =>
      E.right(makeResponse(HttpStatusCodeEnum.HTTP_STATUS_500, "Error"))
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).rejects.toStrictEqual(
      new Error("Cannot upsert service activation with response code 500")
    );

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCgnExpirationMock).not.toHaveBeenCalled();
    expect(enqueueActivatedCGNMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when expiration storage fails", async () => {
    storeCgnExpirationMock.mockReturnValueOnce(TE.left(new Error("Error")));

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCgnExpirationMock).toBeCalledTimes(1);
    expect(enqueueActivatedCGNMessageMock).not.toHaveBeenCalled();
  });

  it("should throw when activated cgn message enqueue fails", async () => {
    enqueueActivatedCGNMessageMock.mockReturnValueOnce(
      TE.left(new Error("Error"))
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).rejects.toStrictEqual(new Error("Error"));

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCgnExpirationMock).toBeCalledTimes(1);
    expect(enqueueActivatedCGNMessageMock).toBeCalledTimes(1);
  });

  it("should succeed and create a new pending card when it not exists", async () => {
    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).resolves.toStrictEqual(true);

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).toBeCalledTimes(1);
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCgnExpirationMock).toBeCalledTimes(1);
    expect(enqueueActivatedCGNMessageMock).toBeCalledTimes(1);
  });

  it("should succeed and recover an existing pending card when already existing", async () => {
    findLastVersionByModelIdMock.mockReturnValueOnce(
      TE.right(O.some({
        fiscalCode: aFiscalCode,
        id: "A_USER_CGN_ID" as NonEmptyString,
        card: aUserCardPending
      }))
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).resolves.toStrictEqual(true);

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).not.toBeCalled();
    expect(upsertServiceActivationMock).toBeCalledTimes(1);
    expect(storeCgnExpirationMock).toBeCalledTimes(1);
    expect(enqueueActivatedCGNMessageMock).toBeCalledTimes(1);
  });

  it("should succeed and recover an existing activated card when already existing", async () => {
    findLastVersionByModelIdMock.mockReturnValueOnce(
      TE.right(O.some({
        fiscalCode: aFiscalCode,
        id: "A_USER_CGN_ID" as NonEmptyString,
        card: aUserCardActivated
      }))
    );

    const promised = handler(
      userCgnModelMock,
      servicesClientMock,
      storeCgnExpirationMock,
      queueStorageMock
    )(context, queueMessage);

    await expect(promised).resolves.toStrictEqual(true);

    expect(findLastVersionByModelIdMock).toBeCalledTimes(1);
    expect(upsertModelMock).not.toBeCalled();
    expect(upsertServiceActivationMock).not.toBeCalled();
    expect(storeCgnExpirationMock).not.toBeCalled();
    expect(enqueueActivatedCGNMessageMock).toBeCalledTimes(1);
  });
});
