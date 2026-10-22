# io-cgn
This is a monorepo that contains all the backend microservices and functionalities related to CGN in IO.

## Devcontainer

Open the repository in VS Code and run **Dev Containers: Reopen in Container**. It provides Node 22, pnpm (via corepack), Azure Functions Core Tools, Terraform and the pre-commit hooks, plus these services reachable from the workspace container:

| Service | Host | Ports |
| --- | --- | --- |
| Azurite | `azurite` | 10000 (blob), 10001 (queue), 10002 (table) |
| Cosmos DB emulator | `cosmosdb` | 8081 |
| Redis | `redis` | 6379 |

## Submodules

`cgn-onboarding-portal-backend` and `cgn-onboarding-portal-frontend` are referenced here only so that GitHub Actions can deploy them. They are developed, built and tested in their own repositories and are not initialised in the devcontainer.

The `update-submodules` pre-commit hook moves each submodule pointer to the tip of its remote `master` on every commit. It fails if a remote is unreachable, so the commit has to wait until it is.
