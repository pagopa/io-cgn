import { trackErrorToVoid } from "../appinsights.js";

describe("trackErrorToVoid", () => {
  it("should not throw when no telemetry client is set", () => {
    expect(() => trackErrorToVoid(new Error("an error"))).not.toThrow();
  });
});
