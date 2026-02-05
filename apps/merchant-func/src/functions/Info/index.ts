import { HttpRequest, InvocationContext } from "@azure/functions";

import { HttpResponseInit } from "../../utils/middleware.js";
import { Info } from "./handler.js";

// Create the handler
const infoHandler = Info();

// Export the function for Azure Functions V4
export async function info(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log(`Info HTTP trigger function processed request.`);
  return infoHandler(request, context);
}
