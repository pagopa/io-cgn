import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

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
