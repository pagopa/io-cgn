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
pnpm build
docker-compose up -d --build
docker-compose logs -f functions
open http://localhost/some/path/test
```

## Deploy

Deploy appens with this [pipeline](./azure-pipelines.yml)
(workflow) configured on [Azure DevOps - io-functions-cgn](https://dev.azure.com/pagopa-io/io-functions-cgn).

## Environment variables

The runtime validation schema lives in [`utils/config.ts`](./utils/config.ts).
[`.env.example`](./.env.example) is a minimal local template, not an exhaustive list of all accepted variables.
