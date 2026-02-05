import { HttpRequest, InvocationContext } from "@azure/functions";

import initTelemetryClient from "../../utils/appinsights.js";
import { getConfigOrThrow } from "../../utils/config.js";
import { HttpResponseInit } from "../../utils/middleware.js";
import { getRedisClientFactory } from "../../utils/redis.js";
import { ValidateOtp } from "./handler.js";

// load config and ensure it is correct
const config = getConfigOrThrow();

// initialize telemetry client
initTelemetryClient();

const redisClientFactory = getRedisClientFactory(config);

// Create the handler
const validateOtpHandler = ValidateOtp(redisClientFactory);

// Export the function for Azure Functions V4
export async function validateOtp(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log(`ValidateOtp HTTP trigger function processed request.`);
  return validateOtpHandler(request, context);
}
