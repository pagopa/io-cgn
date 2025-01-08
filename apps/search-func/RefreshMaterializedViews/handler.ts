import { AzureFunction, Context } from "@azure/functions";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { QueryTypes, Sequelize } from "sequelize";

import { trackErrorToVoid, trackEventToVoid } from "../utils/appinsights";

export const getMaterializedViewRefreshHandler =
  (cgnOperatorDb: Sequelize): AzureFunction =>
  // eslint-disable-next-line
  async (_: Context): Promise<boolean> =>
    pipe(
      TE.tryCatch(
        () =>
          cgnOperatorDb.query(
            `REFRESH MATERIALIZED VIEW CONCURRENTLY online_merchant; REFRESH MATERIALIZED VIEW CONCURRENTLY offline_merchant; REFRESH MATERIALIZED VIEW CONCURRENTLY merchant; REFRESH MATERIALIZED VIEW CONCURRENTLY published_product_category`,
            { type: QueryTypes.RAW },
          ),
        E.toError,
      ),
      TE.bimap(
        (e) => {
          trackErrorToVoid(e);
          return false;
        },
        () => {
          trackEventToVoid("materialized.view.refreshed");
          return true;
        },
      ),
      TE.toUnion,
    )();
