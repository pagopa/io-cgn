/* tslint:disable: no-any */
import { BlobService } from "azure-storage";
import * as date_fns from "date-fns";
import * as TE from "fp-ts/lib/TaskEither";
import { CosmosResource } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { context } from "../../__mocks__/durable-functions";
import { cgnActivatedDates, testFail } from "../../__mocks__/mock";
import {
  CardActivated,
  StatusEnum as ActivatedStatusEnum
} from "../../generated/definitions/CardActivated";
import { RetrievedUserCgn } from "../../models/user_cgn";
import {
  ActivityInput,
  getDeleteLegalDataBackupActivityHandler
} from "../handler";
import * as blobUtils from "../utils";
import { BlobCreationFailure } from "../utils";
import { CcdbNumber } from "../../generated/definitions/CcdbNumber";
import {
  CardRevoked,
  StatusEnum as RevokedStatusEnum
} from "../../generated/definitions/CardRevoked";
import { Card } from "../../generated/definitions/Card";
import { EycaCardRevoked } from "../../generated/definitions/EycaCardRevoked";
import { RetrievedUserEycaCard } from "../../models/user_eyca_card";
import { EycaCard } from "../../generated/definitions/EycaCard";
import { pipe } from "fp-ts/lib/function";
import { toError } from "fp-ts/lib/Either";

// MessageContentBlobService
const messageContentBlobService = ({} as unknown) as BlobService;
const messageContentContainerName = "CGN_BACKUP_DATA" as NonEmptyString;
const messageContentFolderName = "cgn" as NonEmptyString;

const aFiscalCode = "RODFDS89S10H501T" as FiscalCode;

const aCosmosResourceMetadata: Omit<CosmosResource, "id"> = {
  _etag: "_etag",
  _rid: "_rid",
  _self: "_self",
  _ts: 1
};

const now = new Date();
const aUserEycaCardNumber = "X321-Y321-Z321-W321" as CcdbNumber;

const aRevocationRequest = {
  reason: "aMotivation" as NonEmptyString
};

const commonRetrievedAttributes = {
  ...aCosmosResourceMetadata,
  fiscalCode: aFiscalCode,
  id: "123" as NonEmptyString,
  kind: "IRetrievedUserCgn" as const,
  version: 0 as NonNegativeInteger
};

const anActivatedCgn: CardActivated = {
  ...cgnActivatedDates,
  status: ActivatedStatusEnum.ACTIVATED
};
const aCgnUserCardRevoked: CardRevoked = {
  ...cgnActivatedDates,
  revocation_date: now,
  revocation_reason: aRevocationRequest.reason,
  status: RevokedStatusEnum.REVOKED
};

const wrapCardWithCommonRetrievedAttributes = (card: Card) => ({
  ...commonRetrievedAttributes,
  card
});

const wrapEycaCardWithCommonRetrievedAttributes = (
  card: EycaCard
): RetrievedUserEycaCard => ({
  ...commonRetrievedAttributes,
  kind: "IRetrievedUserEycaCard" as const,
  card
});
const anArrayOfCgnCardResults: ReadonlyArray<RetrievedUserCgn> = [
  wrapCardWithCommonRetrievedAttributes(anActivatedCgn),
  wrapCardWithCommonRetrievedAttributes(aCgnUserCardRevoked)
];
const anEycaUserCardRevoked: EycaCardRevoked = {
  ...cgnActivatedDates,
  card_number: aUserEycaCardNumber,
  revocation_date: now,
  revocation_reason: aRevocationRequest.reason,
  status: RevokedStatusEnum.REVOKED
};
const anArrayOfEycaCardResults: ReadonlyArray<RetrievedUserEycaCard> = [
  wrapEycaCardWithCommonRetrievedAttributes(anEycaUserCardRevoked)
];

const eycaFindAllMock = jest
  .fn()
  .mockImplementation(() => TE.of(anArrayOfEycaCardResults));

const cgnFindAllMock = jest
  .fn()
  .mockImplementation(() => TE.of(anArrayOfCgnCardResults));

const userEycaModelMock = {
  findAllEycaCards: eycaFindAllMock
};

const userCgnModelMock = {
  findAllCgnCards: cgnFindAllMock
};

const activityInput: ActivityInput = {
  fiscalCode: aFiscalCode
};

const saveDataToBlobMock = jest
  .fn()
  .mockImplementation(() => TE.of(activityInput));

jest.spyOn(blobUtils, "saveDataToBlob").mockImplementation(saveDataToBlobMock);

describe("Deleted Card Data to backup to legal reasons", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a failure if an Activity Input decode fail", async () => {
    const deleteLegalDataBackupActivityHandler = getDeleteLegalDataBackupActivityHandler(
      messageContentBlobService,
      messageContentContainerName,
      messageContentFolderName,
      userCgnModelMock as any,
      userEycaModelMock as any
    );

    const response = await deleteLegalDataBackupActivityHandler(
      context,
      {} as any
    );

    expect(response.kind).toBe("FAILURE");
  });

  it("should throw if a data backup fails", async () => {
    const deleteLegalDataBackupActivityHandler = getDeleteLegalDataBackupActivityHandler(
      messageContentBlobService,
      messageContentContainerName,
      messageContentFolderName,
      userCgnModelMock as any,
      userEycaModelMock as any
    );

    saveDataToBlobMock.mockImplementationOnce(() =>
      TE.left(
        BlobCreationFailure.encode({
          kind: "BLOB_FAILURE",
          reason: "Blob failure test"
        })
      )
    );

    await pipe(
      TE.tryCatch(
        () => deleteLegalDataBackupActivityHandler(context, activityInput),
        toError
      ),
      TE.bimap(e => {
        expect(e).toBeDefined();
        expect(saveDataToBlobMock).toHaveBeenCalled();
        expect(e.message).toContain(
          "TRANSIENT FAILURE|ERROR=Cannot backup CGN data"
        );
      }, testFail)
    )();
  });

  it("should throw if cgn data retrieve fails", async () => {
    const deleteLegalDataBackupActivityHandler = getDeleteLegalDataBackupActivityHandler(
      messageContentBlobService,
      messageContentContainerName,
      messageContentFolderName,
      userCgnModelMock as any,
      userEycaModelMock as any
    );

    cgnFindAllMock.mockImplementationOnce(() =>
      TE.left(new Error("Cannot query cgn cards"))
    );
    await pipe(
      TE.tryCatch(
        () => deleteLegalDataBackupActivityHandler(context, activityInput),
        toError
      ),
      TE.bimap(e => {
        expect(cgnFindAllMock).toHaveBeenCalled();
        expect(e).toBeDefined();
        expect(e.message).toContain(
          "TRANSIENT FAILURE|ERROR=Cannot retrieve all cgn cards"
        );
      }, testFail)
    )();
  });

  it("should throw if eyca data retrieve fails", async () => {
    const deleteLegalDataBackupActivityHandler = getDeleteLegalDataBackupActivityHandler(
      messageContentBlobService,
      messageContentContainerName,
      messageContentFolderName,
      userCgnModelMock as any,
      userEycaModelMock as any
    );

    eycaFindAllMock.mockImplementationOnce(() =>
      TE.left(new Error("Cannot query eyca cards"))
    );

    await pipe(
      TE.tryCatch(
        () => deleteLegalDataBackupActivityHandler(context, activityInput),
        toError
      ),
      TE.bimap(e => {
        expect(cgnFindAllMock).toHaveBeenCalled();
        expect(eycaFindAllMock).toHaveBeenCalled();
        expect(e).toBeDefined();
        expect(e.message).toContain(
          "TRANSIENT FAILURE|ERROR=Cannot retrieve all eyca cards"
        );
      }, testFail)
    )();
  });

  it("should return success after backup saved to blob storage", async () => {
    const deleteLegalDataBackupActivityHandler = getDeleteLegalDataBackupActivityHandler(
      messageContentBlobService,
      messageContentContainerName,
      messageContentFolderName,
      userCgnModelMock as any,
      userEycaModelMock as any
    );

    const response = await deleteLegalDataBackupActivityHandler(
      context,
      activityInput
    );

    expect(response.kind).toBe("SUCCESS");
  });
});
