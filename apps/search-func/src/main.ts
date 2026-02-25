import { app } from "@azure/functions";

import { Count } from "../Count/handler";
import { GetDiscountBucketCode } from "../GetDiscountBucketCode/handler";
import { GetMerchant } from "../GetMerchant/handler";
import { GetOfflineMerchants } from "../GetOfflineMerchants/handler";
import { GetOnlineMerchants } from "../GetOnlineMerchants/handler";
import { GetPublishedProductCategories } from "../GetPublishedProductCategories/handler";
import { Info } from "../Info/handler";
import { getMaterializedViewRefreshHandler } from "../RefreshMaterializedViews/handler";
import { Search } from "../Search/handler";
import { cgnOperatorDb } from "../client/sequelize";
import initTelemetryClient from "../utils/appinsights";
import { getConfigOrThrow } from "../utils/config";
import { getRedisClientFactory } from "../utils/redis";

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
app.http("Count", {
  authLevel: "function",
  handler: Count(cgnOperatorDb),
  methods: ["GET"],
  route: "api/v1/cgn/operator-search/count",
});

app.http("GetDiscountBucketCode", {
  authLevel: "function",
  handler: GetDiscountBucketCode(
    cgnOperatorDb,
    redisClientFactory,
    config.CGN_BUCKET_CODE_LOCK_LIMIT,
  ),
  methods: ["GET"],
  route: "api/v1/cgn/operator-search/discount-bucket-code/{discountId}",
});

app.http("GetMerchant", {
  authLevel: "function",
  handler: GetMerchant(
    cgnOperatorDb,
    config.CDN_MERCHANT_IMAGES_BASE_URL,
    config.CGN_EXTERNAL_SOURCE_HEADER_NAME,
  ),
  methods: ["GET"],
  route: "api/v1/cgn/operator-search/merchants/{merchantId}",
});

app.http("GetOfflineMerchants", {
  authLevel: "function",
  handler: GetOfflineMerchants(cgnOperatorDb),
  methods: ["POST"],
  route: "api/v1/cgn/operator-search/offline-merchants",
});

app.http("GetOnlineMerchants", {
  authLevel: "function",
  handler: GetOnlineMerchants(cgnOperatorDb),
  methods: ["POST"],
  route: "api/v1/cgn/operator-search/online-merchants",
});

app.http("GetPublishedProductCategories", {
  authLevel: "function",
  handler: GetPublishedProductCategories(cgnOperatorDb),
  methods: ["GET"],
  route: "api/v1/cgn/operator-search/published-product-categories",
});

app.http("Info", {
  authLevel: "anonymous",
  handler: Info(),
  methods: ["GET"],
  route: "api/v1/cgn/operator-search/info",
});

app.http("Search", {
  authLevel: "function",
  handler: Search(cgnOperatorDb),
  methods: ["POST"],
  route: "api/v1/cgn/operator-search/search",
});

app.timer("RefreshMaterializedViews", {
  handler: getMaterializedViewRefreshHandler(cgnOperatorDb),
  schedule: "0 0 0 * * *",
});
