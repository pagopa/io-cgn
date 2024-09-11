import { Context } from "@azure/functions";
import { BlobService } from "azure-storage";
import { flow, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { UserCgnModel } from "../models/user_cgn";
import { UserEycaCardModel } from "../models/user_eyca_card";
import { ActivityResult, success } from "../utils/activity";
import { errorsToError } from "../utils/conversions";
import {
  toPermanentFailure,
  toTransientFailure,
  trackFailure
} from "../utils/errors";
import { saveDataToBlob } from "./utils";

export const ActivityInput = t.interface({
  fiscalCode: FiscalCode
});
export type ActivityInput = t.TypeOf<typeof ActivityInput>;

export const getDeleteLegalDataBackupActivityHandler = (
  cardsDataBackupBlobService: BlobService,
  cardsDataBackupContainerName: NonEmptyString,
  cardsDataBackupFolderName: NonEmptyString,
  userCgnModel: UserCgnModel,
  userEycaModel: UserEycaCardModel,
  logPrefix: string = "DeleteLegalDataBackupActivity"
  // eslint-disable-next-line max-params
) => (context: Context, input: unknown): Promise<ActivityResult> => {
  const fail = trackFailure(context, logPrefix);

  return pipe(
    input,
    ActivityInput.decode,
    TE.fromEither,
    TE.mapLeft(
      flow(errorsToError, e =>
        toPermanentFailure(e, "Cannot decode Activity Input")
      )
    ),
    TE.chain(activityInput =>
      pipe(
        userCgnModel.findAllCgnCards(activityInput.fiscalCode),
        TE.mapLeft(_ => toTransientFailure(_, "Cannot retrieve all cgn cards")),
        TE.chain(cgnCards =>
          pipe(
            userEycaModel.findAllEycaCards(activityInput.fiscalCode),
            TE.mapLeft(_ =>
              toTransientFailure(_, "Cannot retrieve all eyca cards")
            ),
            TE.map(eycaCards => ({
              cgnCards,
              eycaCards
            }))
          )
        ),
        TE.chainW(retrieveDataOutput =>
          pipe(
            saveDataToBlob(
              cardsDataBackupBlobService,
              cardsDataBackupContainerName,
              cardsDataBackupFolderName,
              `${activityInput.fiscalCode}.json` as NonEmptyString,
              retrieveDataOutput
            ),
            TE.mapLeft(err =>
              toTransientFailure(
                new Error(`${err.kind}|${err.reason}`),
                "Cannot backup CGN data"
              )
            )
          )
        )
      )
    ),
    TE.bimap(fail, success),
    TE.toUnion
  )();
};
