# IO CGN - GitHub Repository Settings

<!-- markdownlint-disable -->
<!-- BEGINNING OF PRE-COMMIT-TERRAFORM DOCS HOOK -->
## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_azurerm"></a> [azurerm](#provider\_azurerm) | 4.11.0 |
| <a name="provider_github"></a> [github](#provider\_github) | 6.4.0 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [github_actions_environment_secret.env_app_cd_secrets](https://registry.terraform.io/providers/hashicorp/github/latest/docs/resources/actions_environment_secret) | resource |
| [github_actions_environment_secret.env_cd_secrets](https://registry.terraform.io/providers/hashicorp/github/latest/docs/resources/actions_environment_secret) | resource |
| [github_actions_environment_secret.env_ci_secrets](https://registry.terraform.io/providers/hashicorp/github/latest/docs/resources/actions_environment_secret) | resource |
| [github_actions_secret.repo_secrets](https://registry.terraform.io/providers/hashicorp/github/latest/docs/resources/actions_secret) | resource |
| [github_repository_environment.github_repository_environment_app_cd](https://registry.terraform.io/providers/hashicorp/github/latest/docs/resources/repository_environment) | resource |
| [github_repository_environment.github_repository_environment_cd](https://registry.terraform.io/providers/hashicorp/github/latest/docs/resources/repository_environment) | resource |
| [github_repository_environment.github_repository_environment_ci](https://registry.terraform.io/providers/hashicorp/github/latest/docs/resources/repository_environment) | resource |
| [azurerm_client_config.current](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/client_config) | data source |
| [azurerm_subscription.current](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/subscription) | data source |
| [azurerm_user_assigned_identity.identity_app_cd](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/user_assigned_identity) | data source |
| [azurerm_user_assigned_identity.identity_cd](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/user_assigned_identity) | data source |
| [azurerm_user_assigned_identity.identity_ci](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/user_assigned_identity) | data source |
| [github_organization_teams.all](https://registry.terraform.io/providers/hashicorp/github/latest/docs/data-sources/organization_teams) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_domain"></a> [domain](#input\_domain) | Domain | `string` | n/a | yes |
| <a name="input_env"></a> [env](#input\_env) | Environment | `string` | n/a | yes |
| <a name="input_env_short"></a> [env\_short](#input\_env\_short) | Short environment | `string` | n/a | yes |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | IO Prefix | `string` | `"io"` | no |
| <a name="input_repository"></a> [repository](#input\_repository) | Name of the repository | `string` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_environment"></a> [environment](#output\_environment) | n/a |
<!-- END OF PRE-COMMIT-TERRAFORM DOCS HOOK -->
