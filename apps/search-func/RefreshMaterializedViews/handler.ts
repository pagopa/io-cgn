import { AzureFunction, Context } from "@azure/functions";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { QueryTypes, Sequelize } from "sequelize";
import { trackErrorToVoid, trackEventToVoid } from "../utils/appinsights";

export const getMaterializedViewRefreshHandler = (
  cgnOperatorDb: Sequelize
): AzureFunction => async (_: Context): Promise<void> =>
  pipe(
    TE.tryCatch(
      () =>
        cgnOperatorDb.query(
          `REFRESH MATERIALIZED VIEW CONCURRENTLY online_merchant; REFRESH MATERIALIZED VIEW CONCURRENTLY offline_merchant; REFRESH MATERIALIZED VIEW CONCURRENTLY merchant; REFRESH MATERIALIZED VIEW CONCURRENTLY published_product_category`,
          { type: QueryTypes.RAW }
        ),
      E.toError
    ),
    TE.mapLeft(trackErrorToVoid),
    TE.map(_ => trackEventToVoid("materialized.view.refreshed")),
    TE.toUnion
  )();
