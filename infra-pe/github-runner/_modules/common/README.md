# common

<!-- BEGIN_TF_DOCS -->
## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_azurerm"></a> [azurerm](#provider\_azurerm) | 3.117.0 |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_container_app_environment_runner"></a> [container\_app\_environment\_runner](#module\_container\_app\_environment\_runner) | github.com/pagopa/terraform-azurerm-v3.git//container_app_environment_v2 | v8.50.0 |
| <a name="module_subnet_runner"></a> [subnet\_runner](#module\_subnet\_runner) | github.com/pagopa/terraform-azurerm-v3.git//subnet | v8.50.0 |

## Resources

| Name | Type |
|------|------|
| [azurerm_management_lock.lock_cae](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/management_lock) | resource |
| [azurerm_resource_group.rg_github_runner](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/resource_group) | resource |
| [azurerm_log_analytics_workspace.law_common](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/log_analytics_workspace) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_domain"></a> [domain](#input\_domain) | Domain name | `string` | n/a | yes |
| <a name="input_env"></a> [env](#input\_env) | Environment | `string` | n/a | yes |
| <a name="input_env_short"></a> [env\_short](#input\_env\_short) | Short environment | `string` | n/a | yes |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | IO Prefix | `string` | `"io"` | no |
| <a name="input_repository"></a> [repository](#input\_repository) | Name of the repository | `string` | n/a | yes |
| <a name="input_snet"></a> [snet](#input\_snet) | Subnet configuration | <pre>object({<br/>    cidr = string<br/>  })</pre> | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | Tags for the resources | `map(any)` | n/a | yes |
| <a name="input_vnet"></a> [vnet](#input\_vnet) | Virtual Network configuration | <pre>object({<br/>    name                = string<br/>    resource_group_name = string<br/>  })</pre> | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_container_app_environment"></a> [container\_app\_environment](#output\_container\_app\_environment) | n/a |
<!-- END_TF_DOCS -->
