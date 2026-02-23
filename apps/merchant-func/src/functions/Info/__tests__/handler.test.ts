import * as TE from "fp-ts/lib/TaskEither.js";

import { HealthCheck, HealthProblem } from "../../../utils/healthcheck.js";
import { InfoHandler } from "../handler.js";

afterEach(() => {
  jest.clearAllMocks();
});

describe("InfoHandler", () => {
  it("should return an internal error if the application is not healthy", async () => {
    const healthCheck: HealthCheck = TE.left([
      "failure 1" as HealthProblem<"Config">,
      "failure 2" as HealthProblem<"Config">,
    ]);
    const handler = InfoHandler(healthCheck);

    const response = await handler();

    expect(response.kind).toBe("IResponseErrorInternal");
  });

  it("should return a success if the application is healthy", async () => {
    const healthCheck: HealthCheck = TE.of(true);
    const handler = InfoHandler(healthCheck);

    const response = await handler();

    expect(response.kind).toBe("IResponseSuccessJson");
  });
});
