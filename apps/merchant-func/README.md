# merchant-func

Azure Functions for merchant CGN operations - **upgraded to Azure Functions Programming Model V4**.

## Project Structure

```
merchant-func/
├── src/
│   ├── functions.ts              # Function registration (V4 entry point)
│   ├── functions/
│   │   ├── Info/                 # Health check endpoint
│   │   │   ├── index.ts
│   │   │   ├── handler.ts
│   │   │   └── __tests__/
│   │   └── ValidateOtp/          # OTP validation endpoint
│   │       ├── index.ts
│   │       ├── handler.ts
│   │       └── __tests__/
│   └── utils/                    # Shared utilities
│       ├── appinsights.ts        # Application Insights telemetry
│       ├── config.ts             # Environment configuration
│       ├── healthcheck.ts        # Health check logic
│       ├── middleware.ts         # V4 middleware system
│       ├── redis.ts              # Redis client factory
│       ├── redis_storage.ts      # Redis operations
│       ├── privacy.ts            # Error obfuscation
│       ├── conversions.ts        # Type conversions
│       └── __tests__/
├── generated/                    # OpenAPI generated types
├── openapi/                      # OpenAPI specification
└── __mocks__/                    # Test mocks
```

## Sviluppo in locale

```shell
cp env.example .env
pnpm install
pnpm generate
pnpm build
pnpm start
open http://localhost:7071/api/v1/merchant/cgn/info
```

## Available Functions

### ValidateOtp
- **Route**: `POST /api/v1/merchant/cgn/otp/validate`
- **Auth**: Function key required
- **Purpose**: Validates and optionally invalidates OTP codes for CGN merchants

### Info
- **Route**: `GET /api/v1/merchant/cgn/info`
- **Auth**: Anonymous
- **Purpose**: Health check endpoint returning app name and version

## Azure Functions V4 Migration

This app has been migrated from Azure Functions Programming Model V3 to V4. Key changes:

- **No more Express**: Native V4 HTTP handlers with `HttpRequest`/`HttpResponseInit`
- **Code-based registration**: Functions registered in `src/functions.ts` (no `function.json` files)
- **ES Modules**: Full ESM support with TypeScript
- **Middleware system**: Custom V4-compatible middleware in `src/utils/middleware.ts`

For migration guide and patterns, see [docs/migration-v3-to-v4.md](../../docs/migration-v3-to-v4.md).

## Deploy

Il deploy avviene tramite una [pipeline](./.devops/deploy-pipelines.yml)
(workflow) configurata su [Azure DevOps](https://dev.azure.com/pagopa-io/).
