import { CosmosClient } from "@azure/cosmos";
import * as H from "@pagopa/handler-kit";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as RA from "fp-ts/ReadonlyArray";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import { identity, pipe } from "fp-ts/function";
import { HealthCheckError } from "../utils/errors";
import { getCosmosHealth } from "../utils/cosmosdb";

const getHealthCheck: RTE.ReaderTaskEither<
  {
    cosmosClient: CosmosClient;
  },
  Error,
  void
> = ({
  cosmosClient
}) =>
  // It runs multiple health checks in parallel
  pipe(
    [
      pipe({ cosmosClient }, getCosmosHealth),
    ],
    RA.wilt(T.ApplicativePar)(identity),
    T.chain(({ left: errors }) =>
      pipe(
        errors,
        RA.head,
        O.fold(
          // return undefined in case errors array is empty
          () => TE.right(undefined),
          () => TE.left(errors),
        ),
      ),
    ),
    // It collects the errors, if any
    TE.mapLeft((errors) => new HealthCheckError(errors.join(". "))),
  );

export const HealthHandler = H.of(() =>
  pipe(
    getHealthCheck,
    RTE.map(() => ({
      message: "it works!",
    })),
    RTE.map(H.successJson),
  ),
);