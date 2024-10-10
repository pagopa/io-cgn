import { Context } from "@azure/functions";
import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { constVoid, flow, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { ServicesAPIClient } from "../clients/services";
import { StatusEnum as PendingStatusEnum } from "../generated/definitions/CardPending";
import { Activation } from "../generated/services-api/Activation";
import {
  ActivationStatus,
  ActivationStatusEnum
} from "../generated/services-api/ActivationStatus";
import { UserCgn, UserCgnModel } from "../models/user_cgn";
import {
  CardActivatedMessage,
  CardPendingMessage
} from "../types/queue-message";
import { fromBase64, toBase64 } from "../utils/base64";
import { genRandomCardCode } from "../utils/cgnCode";
import { errorsToError } from "../utils/conversions";
import { throwError, trackError } from "../utils/errors";
import { StoreCardExpirationFunction } from "../utils/table_storage";
import { isCardActivated } from "../utils/cgn_checks";
import { QueueStorage } from "../utils/queue";
import { StatusEnum as ActivatedStatusEnum } from "../generated/definitions/CardActivated";

/**
 * Upsert CGN Card on cosmos
 * @returns UserCgn
 */
const upsertCgnCard = (userCgnModel: UserCgnModel, fiscalCode: FiscalCode) =>
  pipe(
    TE.tryCatch(() => genRandomCardCode(), E.toError),
    TE.mapLeft(() => new Error("Cannot generate a new CGN code")),
    TE.chain(cgnCode =>
      pipe(
        userCgnModel.upsert({
          card: { status: PendingStatusEnum.PENDING },
          fiscalCode,
          id: cgnCode,
          kind: "INewUserCgn"
        }),
        TE.mapLeft(
          cosmosErrors =>
            new Error(`${cosmosErrors.kind}|Cannot upsert cosmos CGN`)
        )
      )
    )
  );

/**
 * Creates a new CGN CARD or gets the already existing for the user
 * @param userCgnModel
 * @param fiscalCode
 * @returns TaskEither<Error,UserCgn>
 */
const createOrGetCgnCard = (
  userCgnModel: UserCgnModel,
  fiscalCode: FiscalCode
): TE.TaskEither<Error, UserCgn> =>
  pipe(
    userCgnModel.findLastVersionByModelId([fiscalCode]),
    TE.mapLeft(
      cosmosErrors => new Error(`${cosmosErrors.kind}|Cannot query cosmos CGN`)
    ),
    TE.chainW(
      O.fold(
        () => upsertCgnCard(userCgnModel, fiscalCode),
        userCgn => TE.of(userCgn)
      )
    )
  );

/**
 * Check wheter the activation has been 200 OK
 * @param res
 * @returns
 */
const isUpsertServiceActivationSuccess = (
  res: IResponseType<number, unknown, never>
): res is IResponseType<200, Activation, never> => res.status === 200;

/**
 * Maps statuses to error
 * @param res
 * @returns
 */
const mapUpsertServiceActivationFailure = (
  res: IResponseType<number, unknown, never>
): Error =>
  new Error(
    `Cannot upsert service activation with response code ${res.status}`
  );

/**
 * Upsert special service
 * @param servicesClient
 * @param activationStatus
 * @param fiscalCode
 * @returns
 */
const upsertServiceActivation = (
  servicesClient: ServicesAPIClient,
  activationStatus: ActivationStatus,
  fiscalCode: FiscalCode
): TE.TaskEither<Error, Activation> =>
  pipe(
    TE.tryCatch(
      async () =>
        servicesClient.upsertServiceActivation({
          payload: { fiscal_code: fiscalCode, status: activationStatus }
        }),
      E.toError
    ),
    TE.chainW(flow(TE.fromEither, TE.mapLeft(errorsToError))),
    TE.chainW(
      TE.fromPredicate(
        isUpsertServiceActivationSuccess,
        mapUpsertServiceActivationFailure
      )
    ),
    TE.map(successResponse => successResponse.value)
  );

export const handler = (
  userCgnModel: UserCgnModel,
  servicesClient: ServicesAPIClient,
  storeCgnExpiration: StoreCardExpirationFunction,
  queueStorage: QueueStorage
) => (
  context: Context,
  pendingCgnMessage: CardPendingMessage
): Promise<boolean> =>
  pipe(
    pipe(
      // create or get a pending card
      createOrGetCgnCard(userCgnModel, pendingCgnMessage.fiscal_code),
      TE.chain(userCgn =>
        isCardActivated(userCgn)
          ? // card already activated mean we should go on
            TE.of(userCgn)
          : //else we process
            pipe(
              // upsert special service
              upsertServiceActivation(
                servicesClient,
                ActivationStatusEnum.PENDING,
                pendingCgnMessage.fiscal_code
              ),
              TE.chain(_ =>
                // store expiration date to table storage
                storeCgnExpiration(
                  pendingCgnMessage.fiscal_code,
                  pendingCgnMessage.activation_date,
                  pendingCgnMessage.expiration_date
                )
              ),
              TE.map(_ => userCgn)
            )
      ),
      TE.chain(userCgn =>
        // send activated message to queue
        queueStorage.enqueueActivatedCGNMessage(
          toBase64({
            request_id: pendingCgnMessage.request_id,
            fiscal_code: pendingCgnMessage.fiscal_code,
            activation_date: pendingCgnMessage.activation_date,
            expiration_date: pendingCgnMessage.expiration_date,
            status: ActivatedStatusEnum.ACTIVATED,
            card_id: userCgn.id
          })
        )
      ),
      TE.mapLeft(
        trackError(
          context,
          `[${pendingCgnMessage.request_id}] CgnActivation_2_ProcessPendingQueue`
        )
      )
    ),
    TE.mapLeft(throwError),
    TE.toUnion
  )();
