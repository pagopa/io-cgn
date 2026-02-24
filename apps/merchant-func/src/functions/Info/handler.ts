import { wrapHandlerV4 } from "@pagopa/io-functions-commons/dist/src/utils/azure-functions-v4-express-adapter/index.js";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { pipe } from "fp-ts/lib/function.js";

import {
  HealthCheck,
  checkApplicationHealth,
} from "../../utils/healthcheck.js";

interface IInfo {
  readonly name: string;
  readonly version: string;
}

type InfoHandler = () => Promise<
  IResponseErrorInternal | IResponseSuccessJson<IInfo>
>;

export const InfoHandler =
  (healthCheck: HealthCheck): InfoHandler =>
  async (): Promise<IResponseErrorInternal | IResponseSuccessJson<IInfo>> =>
    pipe(
      healthCheck,
      TE.bimap(
        (problems) => ResponseErrorInternal(problems.join("\n\n")),
        () =>
          ResponseSuccessJson({
            name: "it works!",
            version: "0.0.1",
          }),
      ),
      TE.toUnion,
    )();

export const Info = () => {
  const handler = InfoHandler(checkApplicationHealth());
  return wrapHandlerV4([], handler);
};
