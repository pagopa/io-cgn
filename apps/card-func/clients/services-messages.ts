import nodeFetch from "node-fetch";

import { createClient } from "../generated/services-api-messages/client";
import { getConfigOrThrow } from "../utils/config";

const config = getConfigOrThrow();

const servicesBaseUrl = config.SERVICES_API_URL;
const cgnSubscriptionKey = config.SERVICES_API_KEY;

const fetchApi: typeof fetch = nodeFetch as unknown as typeof fetch;

export const MessagesAPIClient = createClient<"SubscriptionKey">({
  baseUrl: servicesBaseUrl,
  fetchApi,
  withDefaults: (op) => (params) =>
    op({ SubscriptionKey: cgnSubscriptionKey, ...params }),
});
export type MessagesAPIClient = typeof MessagesAPIClient;
