# app_service_attribute_authority

<!-- BEGIN_TF_DOCS -->
## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_azurerm"></a> [azurerm](#provider\_azurerm) | 4.14.0 |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_app_service_attribute_authority"></a> [app\_service\_attribute\_authority](#module\_app\_service\_attribute\_authority) | github.com/pagopa/dx//infra/modules/azure_app_service | a08a2c9d95678902fd74382804693d33c8169e55 |

## Resources

| Name | Type |
|------|------|
| [azurerm_private_dns_a_record.weu_pep](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/private_dns_a_record) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_ai_connection_string"></a> [ai\_connection\_string](#input\_ai\_connection\_string) | The connection string to connect to application insights | `string` | n/a | yes |
| <a name="input_ai_instrumentation_key"></a> [ai\_instrumentation\_key](#input\_ai\_instrumentation\_key) | The key to connect to application insights | `string` | n/a | yes |
| <a name="input_ai_sampling_percentage"></a> [ai\_sampling\_percentage](#input\_ai\_sampling\_percentage) | The sampling percentage for application insights | `string` | n/a | yes |
| <a name="input_attribute_authority_postgres_db_admin_connection_string"></a> [attribute\_authority\_postgres\_db\_admin\_connection\_string](#input\_attribute\_authority\_postgres\_db\_admin\_connection\_string) | The connection string to postgres db | `string` | n/a | yes |
| <a name="input_attribute_authority_tier"></a> [attribute\_authority\_tier](#input\_attribute\_authority\_tier) | The tier for attribute authority app service | `string` | n/a | yes |
| <a name="input_cidr_subnet_cgn_attribute_authority"></a> [cidr\_subnet\_cgn\_attribute\_authority](#input\_cidr\_subnet\_cgn\_attribute\_authority) | CIDR block for attribute authority app service subnet | `string` | n/a | yes |
| <a name="input_domain"></a> [domain](#input\_domain) | Domain | `string` | n/a | yes |
| <a name="input_env_short"></a> [env\_short](#input\_env\_short) | Short environment | `string` | n/a | yes |
| <a name="input_location"></a> [location](#input\_location) | Azure region | `string` | n/a | yes |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | IO Prefix | `string` | n/a | yes |
| <a name="input_private_dns_zone_resource_group_name"></a> [private\_dns\_zone\_resource\_group\_name](#input\_private\_dns\_zone\_resource\_group\_name) | Resource group name of the private DNS zone to use for private endpoints | `string` | n/a | yes |
| <a name="input_private_endpoint_subnet_id"></a> [private\_endpoint\_subnet\_id](#input\_private\_endpoint\_subnet\_id) | Private Endpoints subnet Id | `string` | n/a | yes |
| <a name="input_project"></a> [project](#input\_project) | IO prefix and short environment | `string` | n/a | yes |
| <a name="input_resource_group_name"></a> [resource\_group\_name](#input\_resource\_group\_name) | Name of the resource group where resources will be created | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | Resource tags | `map(any)` | n/a | yes |
| <a name="input_virtual_network"></a> [virtual\_network](#input\_virtual\_network) | Virtual network to create subnet in | <pre>object({<br/>    name                = string<br/>    resource_group_name = string<br/>  })</pre> | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_app_service_attribute_authority"></a> [app\_service\_attribute\_authority](#output\_app\_service\_attribute\_authority) | n/a |
<!-- END_TF_DOCS -->
