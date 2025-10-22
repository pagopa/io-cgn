# application_gateway

<!-- BEGIN_TF_DOCS -->
## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_azurerm"></a> [azurerm](#provider\_azurerm) | n/a |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_agw_identity_roles"></a> [agw\_identity\_roles](#module\_agw\_identity\_roles) | pagopa-dx/azure-role-assignments/azurerm | ~> 1.0 |
| <a name="module_app_gw"></a> [app\_gw](#module\_app\_gw) | git::https://github.com/pagopa/terraform-azurerm-v4.git//app_gateway | v7.40.3 |
| <a name="module_appgateway_snet"></a> [appgateway\_snet](#module\_appgateway\_snet) | git::https://github.com/pagopa/terraform-azurerm-v4.git//subnet | v7.40.3 |

## Resources

| Name | Type |
|------|------|
| [azurerm_public_ip.app_gw_public_ip](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/public_ip) | resource |
| [azurerm_user_assigned_identity.app_gw_identity](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/user_assigned_identity) | resource |
| [azurerm_key_vault.cgn_pe_kv](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault) | data source |
| [azurerm_key_vault_certificate.app_gw_platform](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_certificate) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_apim_hostname"></a> [apim\_hostname](#input\_apim\_hostname) | APIM hostname | `string` | n/a | yes |
| <a name="input_app_gateway_alerts_enabled"></a> [app\_gateway\_alerts\_enabled](#input\_app\_gateway\_alerts\_enabled) | Enable Application Gateway alerts | `bool` | `false` | no |
| <a name="input_app_gateway_max_capacity"></a> [app\_gateway\_max\_capacity](#input\_app\_gateway\_max\_capacity) | Maximum capacity for Application Gateway | `number` | `1` | no |
| <a name="input_app_gateway_min_capacity"></a> [app\_gateway\_min\_capacity](#input\_app\_gateway\_min\_capacity) | Minimum capacity for Application Gateway | `number` | `1` | no |
| <a name="input_app_gw_cert_name"></a> [app\_gw\_cert\_name](#input\_app\_gw\_cert\_name) | Application Gateway certificate name in Key Vault | `string` | n/a | yes |
| <a name="input_azure_subscription_id"></a> [azure\_subscription\_id](#input\_azure\_subscription\_id) | Subscription id | `string` | n/a | yes |
| <a name="input_azurerm_monitor_action_group_id"></a> [azurerm\_monitor\_action\_group\_id](#input\_azurerm\_monitor\_action\_group\_id) | Monitor Action Group ID for alerts | `string` | `null` | no |
| <a name="input_cidr_subnet_cgn_pe_appgateway"></a> [cidr\_subnet\_cgn\_pe\_appgateway](#input\_cidr\_subnet\_cgn\_pe\_appgateway) | CIDR block for AGW subnet | `string` | n/a | yes |
| <a name="input_domain"></a> [domain](#input\_domain) | Domain | `string` | n/a | yes |
| <a name="input_env_short"></a> [env\_short](#input\_env\_short) | Short environment | `string` | n/a | yes |
| <a name="input_key_vault_name"></a> [key\_vault\_name](#input\_key\_vault\_name) | Key Vault name | `string` | n/a | yes |
| <a name="input_location"></a> [location](#input\_location) | Azure region | `string` | n/a | yes |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | IO Prefix | `string` | n/a | yes |
| <a name="input_project"></a> [project](#input\_project) | IO prefix, short environment and short location | `string` | n/a | yes |
| <a name="input_resource_group_name"></a> [resource\_group\_name](#input\_resource\_group\_name) | Name of the resource group where resources will be created | `string` | n/a | yes |
| <a name="input_sku"></a> [sku](#input\_sku) | Sku settings | <pre>object({<br/>    name = string<br/>    tier = string<br/>  })</pre> | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | Resource tags | `map(any)` | n/a | yes |
| <a name="input_virtual_network"></a> [virtual\_network](#input\_virtual\_network) | Virtual network to create subnet in | <pre>object({<br/>    name                = string<br/>    resource_group_name = string<br/>  })</pre> | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_agw"></a> [agw](#output\_agw) | n/a |
<!-- END_TF_DOCS -->
