# IO Functions CGN Citizen

Azure Functions dedicated to CGN's project (Carta Giovani Nazionale).
These functions implements business logic for:
- Card activation
- Card revocation
- Card expiration 

also providing an integration through **EYCA (European Youth Card Association)** 

## Local development

```shell
cp .env.example .env
```

Replace in `.env` the placeholder values with the proper runtime configuration.
Use [`.env.example`](./.env.example) as a minimal starting template for local runs.
The runtime source of truth is [`utils/config.ts`](./utils/config.ts).
[`env.example`](./env.example) only contains optional local Docker-style overrides and legacy local defaults.

```shell
pnpm install
pnpm generate
pnpm build
pnpm start
```

Azurite, the Cosmos DB emulator, a 3-node Redis cluster (`redis`, `redis-2`, `redis-3`) and a single Redis instance (`redis-single`) are provided by the devcontainer (hosts `azurite`, `cosmosdb`, ...). `env.example` targets the cluster (`REDIS_CLUSTER_ENABLED=true`, `REDIS_ENTRA_ID_ENABLED=false`: no TLS, no authentication); switch to `REDIS_URL=redis-single` and `REDIS_CLUSTER_ENABLED=false` to use the single-instance client.

## Deploy

Deploy appens with this [pipeline](./azure-pipelines.yml)
(workflow) configured on [Azure DevOps - io-functions-cgn](https://dev.azure.com/pagopa-io/io-functions-cgn).

## Environment variables

The runtime validation schema lives in [`utils/config.ts`](./utils/config.ts).
[`.env.example`](./.env.example) is a minimal local template, not an exhaustive list of all accepted variables.
