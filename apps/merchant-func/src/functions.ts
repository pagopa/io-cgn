import { app } from "@azure/functions";

import { info } from "./functions/Info/index.js";
import { validateOtp } from "./functions/ValidateOtp/index.js";

/**
 * Azure Functions V4 Programming Model
 * Function registration with code-based configuration
 */

// Register ValidateOtp function
app.http("ValidateOtp", {
  authLevel: "function",
  handler: validateOtp,
  methods: ["POST"],
  route: "api/v1/merchant/cgn/otp/validate",
});

// Register Info function
app.http("Info", {
  authLevel: "anonymous",
  handler: info,
  methods: ["GET"],
  route: "api/v1/merchant/cgn/info",
});

export default app;
