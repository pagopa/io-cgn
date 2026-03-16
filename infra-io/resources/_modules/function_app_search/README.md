# function_app_search

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
| <a name="module_function_app_cgn_search"></a> [function\_app\_cgn\_search](#module\_function\_app\_cgn\_search) | github.com/pagopa/dx//infra/modules/azure_function_app | 5084d6f93194b71fdb40243e0d489d39cbe71958 |

## Resources

| Name | Type |
|------|------|
| [azurerm_api_management_api.cgn_search_platform_v1](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/api_management_api) | resource |
| [azurerm_api_management_api_policy.cgn_search_platform_v1](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/api_management_api_policy) | resource |
| [azurerm_api_management_api_tag.io_cgn_search_api_tag](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/api_management_api_tag) | resource |
| [azurerm_api_management_api_version_set.cgn_search_platform](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/api_management_api_version_set) | resource |
| [azurerm_api_management_product_api.cgn_search_platform_v1](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/api_management_product_api) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_ai_connection_string"></a> [ai\_connection\_string](#input\_ai\_connection\_string) | The connection string to connect to application insights | `string` | n/a | yes |
| <a name="input_ai_instrumentation_key"></a> [ai\_instrumentation\_key](#input\_ai\_instrumentation\_key) | The key to connect to application insights | `string` | n/a | yes |
| <a name="input_ai_sampling_percentage"></a> [ai\_sampling\_percentage](#input\_ai\_sampling\_percentage) | The sampling percentage for application insights | `string` | n/a | yes |
| <a name="input_apim_cgn_product_id"></a> [apim\_cgn\_product\_id](#input\_apim\_cgn\_product\_id) | The product ID of the CGN API Management product | `string` | n/a | yes |
| <a name="input_apim_platform_name"></a> [apim\_platform\_name](#input\_apim\_platform\_name) | The name of the API Management platform | `string` | n/a | yes |
| <a name="input_apim_platform_resource_group_name"></a> [apim\_platform\_resource\_group\_name](#input\_apim\_platform\_resource\_group\_name) | The resource group name of the API Management platform | `string` | n/a | yes |
| <a name="input_app_service_plan_id"></a> [app\_service\_plan\_id](#input\_app\_service\_plan\_id) | The app service plan where you want to host the functions | `string` | `null` | no |
| <a name="input_cgn_cdn_endpoint_base_url"></a> [cgn\_cdn\_endpoint\_base\_url](#input\_cgn\_cdn\_endpoint\_base\_url) | CDN endpoint base url | `string` | n/a | yes |
| <a name="input_cgn_postgres_db_admin_connection_string"></a> [cgn\_postgres\_db\_admin\_connection\_string](#input\_cgn\_postgres\_db\_admin\_connection\_string) | Postgres admin connection string | `string` | n/a | yes |
| <a name="input_cidr_subnet_cgn_search_func"></a> [cidr\_subnet\_cgn\_search\_func](#input\_cidr\_subnet\_cgn\_search\_func) | CIDR block for cgn search function app subnet | `string` | `null` | no |
| <a name="input_domain"></a> [domain](#input\_domain) | Domain | `string` | n/a | yes |
| <a name="input_env_short"></a> [env\_short](#input\_env\_short) | Short environment | `string` | n/a | yes |
| <a name="input_instance_number"></a> [instance\_number](#input\_instance\_number) | The istance number to create | `string` | n/a | yes |
| <a name="input_io_cgn_tag_name"></a> [io\_cgn\_tag\_name](#input\_io\_cgn\_tag\_name) | The name of the IO CGN tag | `string` | n/a | yes |
| <a name="input_location"></a> [location](#input\_location) | Azure region | `string` | n/a | yes |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | IO Prefix | `string` | n/a | yes |
| <a name="input_private_dns_zone_resource_group_name"></a> [private\_dns\_zone\_resource\_group\_name](#input\_private\_dns\_zone\_resource\_group\_name) | Resource group name of the private DNS zone to use for private endpoints | `string` | n/a | yes |
| <a name="input_private_endpoint_subnet_id"></a> [private\_endpoint\_subnet\_id](#input\_private\_endpoint\_subnet\_id) | Private Endpoints subnet Id | `string` | n/a | yes |
| <a name="input_project"></a> [project](#input\_project) | IO prefix and short environment | `string` | n/a | yes |
| <a name="input_redis_password"></a> [redis\_password](#input\_redis\_password) | Redis password | `string` | n/a | yes |
| <a name="input_redis_port"></a> [redis\_port](#input\_redis\_port) | Redis port | `string` | n/a | yes |
| <a name="input_redis_url"></a> [redis\_url](#input\_redis\_url) | Redis url | `string` | n/a | yes |
| <a name="input_resource_group_name"></a> [resource\_group\_name](#input\_resource\_group\_name) | Name of the resource group where resources will be created | `string` | n/a | yes |
| <a name="input_subnet_id"></a> [subnet\_id](#input\_subnet\_id) | A predefined subnet id | `string` | `null` | no |
| <a name="input_tags"></a> [tags](#input\_tags) | Resource tags | `map(any)` | n/a | yes |
| <a name="input_virtual_network"></a> [virtual\_network](#input\_virtual\_network) | Virtual network to create subnet in | <pre>object({<br/>    name                = string<br/>    resource_group_name = string<br/>  })</pre> | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_function_app_cgn_search"></a> [function\_app\_cgn\_search](#output\_function\_app\_cgn\_search) | n/a |
<!-- END_TF_DOCS -->
