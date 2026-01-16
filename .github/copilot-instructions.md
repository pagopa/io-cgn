# io-cgn Codebase Guide

## Project Overview

Monorepo for **CGN (Carta Giovani Nazionale)** - Italian National Youth Card system integrated with **EYCA (European Youth Card Association)**. Manages citizen card lifecycle, merchant portals, and discount services.

## Architecture

### Core Components

- **card-func**: Azure Functions for citizen card lifecycle (activation, revocation, expiration) + EYCA integration
- **attribute-authority-ms**: Fastify microservice for organization attribute management (PostgreSQL)
- **merchant-func**: Azure Functions for merchant/operator operations
- **search-func**: Azure Functions for operator search and discount lookup
- **support-func**: Azure Functions for customer support operations
- **cgn-onboarding-portal-backend**: Spring Boot backend (Java 21) for merchant onboarding
- **cgn-onboarding-portal-frontend**: React/Parcel frontend for merchant portal

### Data Flow

```
Citizen → card-func → CosmosDB (user_cgn/user_eyca_card collections)
                   ↓
              Azure Queues → EYCA CCDB API (card sync)
                   ↓
              IO Services API (push notifications)

Merchant → portal-backend → PostgreSQL (agreements/discounts)
                         ↓
                    EYCA Export Service
```

### Key Technologies

- **Functions**: TypeScript + Azure Functions v3 + Express
- **Backend**: Spring Boot 2.7.18 + Java 21 + Sequelize (attribute-authority-ms)
- **Frontend**: React + Parcel + Bootstrap Italia
- **Data**: CosmosDB (NoSQL), PostgreSQL, Azure Table Storage, Redis
- **Queues**: Azure Storage Queues for async workflows
- **Build**: Turborepo + pnpm workspace + Changesets

## Development Workflows

### Building & Testing

```bash
# Root monorepo commands
pnpm install                    # Install all dependencies
pnpm build                      # Build all TypeScript apps (via turbo)
pnpm code-review                # Full check: typecheck, format, lint, build, coverage
pnpm version                    # Bump versions with changesets
```

### Function Apps (card-func, merchant-func, etc.)

```bash
cd apps/card-func
cp env.example .env             # Configure local environment
pnpm generate                   # Generate OpenAPI clients & models
pnpm build                      # Compile TypeScript
pnpm start                      # Start Azure Functions runtime
docker-compose up -d --build    # Local development with dependencies
```

### Java Backend

```bash
cd cgn-onboarding-portal-backend
mvn clean install
./upgrade_version.sh increment-patch  # Version bump
```

### Frontend

```bash
cd cgn-onboarding-portal-frontend
pnpm install
pnpm generate                   # Generate OpenAPI client from backend spec
pnpm start:uat                  # Run against UAT environment
```

## Code Conventions

### TypeScript Patterns

- **fp-ts/io-ts**: Functional programming with algebraic data types. Use `pipe`, `TaskEither`, `Option` for composition

  ```typescript
  import * as TE from "fp-ts/TaskEither";
  import { pipe } from "fp-ts/lib/function";

  pipe(
    getUserData(fiscalCode),
    TE.chain(validateCard),
    TE.fold(handleError, handleSuccess),
  );
  ```

- **Models**: CosmosDB models in `models/` (UserCgnModel, UserEycaCardModel) use containers
- **Config**: Always use `getConfigOrThrow()` for environment validation
- **Clients**: Singleton instances (cosmosdbClient, redisClientFactory) initialized at module level
- **Function Structure**: Each function folder has `index.ts` (setup) + `handler.ts` (business logic)

### OpenAPI Code Generation

All APIs use `@pagopa/openapi-codegen-ts` to generate types/clients:

```bash
pnpm generate:definitions        # From local openapi/index.yaml
pnpm generate:api-eyca           # External EYCA API client
pnpm generate:api-services       # IO Services API client
```

Generated code goes to `generated/` (gitignored, rebuild on changes).

### Naming Conventions

- Function apps: kebab-case with underscores for steps (e.g., `CgnActivation_1_Start`, `CgnActivation_2_ProcessPendingQueue`)
- Queue-based workflows: Numbered steps indicate orchestration sequence
- Collections: `USER_CGN_COLLECTION_NAME`, `USER_EYCA_CARD_COLLECTION_NAME`
- Environment vars: SCREAMING_SNAKE_CASE (see README.md env tables)

### Testing

- Jest for all TypeScript projects
- `pnpm test:coverage` for coverage reports
- Mocks in `__mocks__/` directories

## Infrastructure

- **infra-io/**: Terraform modules for IO environment (function apps, CosmosDB, storage)
- **infra-pe/**: PE environment infrastructure
- Modules in `_modules/` (function_app_card, function_app_search, etc.)
- GitHub federated identities for CI/CD

## Critical Dependencies

- `@pagopa/io-functions-commons`: Shared IO platform utilities
- `@pagopa/express-azure-functions`: Express → Azure Functions adapter
- `@pagopa/ts-commons`: Type utilities and validation
- External APIs: EYCA CCDB, IO Services API, IO Messages API

## Common Tasks

### Adding a New Function

1. Create folder in relevant app (e.g., `apps/card-func/NewFunction/`)
2. Add `index.ts` (Express setup + CosmosDB init) + `handler.ts` (logic)
3. Add `function.json` for bindings
4. Update `openapi/index.yaml` if HTTP-triggered
5. Run `pnpm generate` to update types

### Updating OpenAPI Specs

1. Edit `openapi/index.yaml` in app folder
2. Run `pnpm generate:definitions`
3. Lint with `pnpm lint:api` (runs `api-lint.sh`)
4. Update handler signatures to match new types

### Version Management

Use Changesets for TypeScript packages:

```bash
pnpm changeset              # Create changeset for changes
pnpm version                # Bump versions + update CHANGELOG.md
pnpm release                # Tag releases
```

## Key Files

- [pnpm-workspace.yaml](pnpm-workspace.yaml): Workspace configuration
- [turbo.json](turbo.json): Build pipeline with task dependencies
- [apps/card-func/utils/config.ts](apps/card-func/utils/config.ts): Configuration type definitions
- [apps/card-func/utils/cosmosdb.ts](apps/card-func/utils/cosmosdb.ts): Singleton CosmosDB client
- [cgn-onboarding-portal-backend/pom.xml](cgn-onboarding-portal-backend/pom.xml): Java dependencies

## Debugging

- Azure Functions: Use `docker-compose logs -f functions` for local runtime
- Application Insights integration via `initTelemetryClient()`
- CosmosDB queries logged when `NODE_ENV=development`
