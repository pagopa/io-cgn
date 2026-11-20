---
"@pagopa/io-cgn-core-redis": minor
"card-func": minor
"merchant-func": minor
"search-func": minor
---

Update `redis` to v5 and move the Redis connection logic to `@pagopa/io-cgn-core-redis`, adding Entra ID authentication on a Redis cluster enabled by `REDIS_CLUSTER_ENABLED` and `REDIS_ENTRA_ID_ENABLED`
