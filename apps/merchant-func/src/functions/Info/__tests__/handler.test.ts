import { InvocationContext } from "@azure/functions";
import * as TE from "fp-ts/lib/TaskEither";

import { HealthCheck, HealthProblem } from "../../../utils/healthcheck";
import { InfoHandler } from "../handler";

const mockContext = {
  log: jest.fn(),
} as unknown as InvocationContext;

const mockRequest = {} as any;

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

    const resultTE = handler(mockRequest, mockContext);
    const response = await resultTE();

    expect(response._tag).toBe("Left");
    if (response._tag === "Left") {
      expect(response.left.kind).toBe("IResponseErrorInternal");
    }
  });

  it("should return a success if the application is healthy", async () => {
    const healthCheck: HealthCheck = TE.of(true);
    const handler = InfoHandler(healthCheck);

    const resultTE = handler(mockRequest, mockContext);
    const response = await resultTE();

    expect(response._tag).toBe("Right");
    if (response._tag === "Right") {
      expect(response.right.kind).toBe("IResponseSuccessJson");
    }
  });
});
