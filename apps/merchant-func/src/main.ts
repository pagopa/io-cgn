import { app } from "@azure/functions";

import { Info } from "./functions/Info/handler.js";
import { ValidateOtp } from "./functions/ValidateOtp/handler.js";
import initTelemetryClient from "./utils/appinsights.js";
import { getConfigOrThrow } from "./utils/config.js";
import { getRedisClientFactory } from "./utils/redis.js";

// ---------------------------------------------------------------
// CONFIG SETUP
// ---------------------------------------------------------------
const config = getConfigOrThrow();

// ---------------------------------------------------------------
// DEPENDENCY INITIALISATION
// ---------------------------------------------------------------
initTelemetryClient();

const redisClientFactory = getRedisClientFactory(config);

// ---------------------------------------------------------------
// MOUNT HANDLERS
// ---------------------------------------------------------------
app.http("ValidateOtp", {
  authLevel: "function",
  handler: ValidateOtp(redisClientFactory),
  methods: ["POST"],
  route: "api/v1/merchant/cgn/otp/validate",
});

app.http("Info", {
  authLevel: "anonymous",
  handler: Info(),
  methods: ["GET"],
  route: "api/v1/merchant/cgn/info",
});
