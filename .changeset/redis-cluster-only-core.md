---
"@pagopa/io-cgn-core-redis": minor
---

Remove the password and single-node Redis clients: only a cluster is supported, with Entra ID authentication over TLS by default or a plain cluster when `entraIdEnabled` is `false`
