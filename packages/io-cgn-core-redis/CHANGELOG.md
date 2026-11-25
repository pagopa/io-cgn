# @pagopa/io-cgn-core-redis

## 0.2.0

### Minor Changes

- a990a65: Support a plain Redis cluster for local development and check Redis (PING) in the health endpoints

## 0.1.0

### Minor Changes

- 475842e: Update `redis` to v5 and move the Redis connection logic to `@pagopa/io-cgn-core-redis`, adding Entra ID authentication on a Redis cluster enabled by `REDIS_CLUSTER_ENABLED` and `REDIS_ENTRA_ID_ENABLED`
