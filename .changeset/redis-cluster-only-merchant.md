---
"merchant-func": minor
---

Remove the Redis password and single-node modes: the Redis client now only connects to a cluster, configured with `REDIS_URL`, `REDIS_PORT` and `REDIS_ENTRA_ID_ENABLED` (`REDIS_PASSWORD`, `REDIS_TLS_ENABLED` and `REDIS_CLUSTER_ENABLED` are no longer read)
