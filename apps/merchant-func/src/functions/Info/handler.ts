import { HttpRequest, InvocationContext } from "@azure/functions";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import * as packageJson from "../../../package.json";
import {
  HealthCheck,
  checkApplicationHealth,
} from "../../utils/healthcheck.js";
import { simpleHandler } from "../../utils/middleware.js";

interface IInfo {
  readonly name: string;
  readonly version: string;
}

type InfoHandler = (
  _request: HttpRequest,
  _context: InvocationContext,
) => TE.TaskEither<IResponseErrorInternal, IResponseSuccessJson<IInfo>>;

export const InfoHandler =
  (healthCheck: HealthCheck): InfoHandler =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (_request, _context): ReturnType<InfoHandler> =>
    pipe(
      healthCheck,
      TE.bimap(
        (problems) => ResponseErrorInternal(problems.join("\n\n")),
        () =>
          ResponseSuccessJson({
            name: packageJson.name,
            version: packageJson.version,
          }),
      ),
    );

export const Info = () => {
  const handler = InfoHandler(checkApplicationHealth());

  return simpleHandler(handler);
};
