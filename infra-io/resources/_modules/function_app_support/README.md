# function_app_support

<!-- BEGIN_TF_DOCS -->
## Requirements

No requirements.

## Providers

No providers.

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_function_app_cgn_support"></a> [function\_app\_cgn\_support](#module\_function\_app\_cgn\_support) | github.com/pagopa/dx//infra/modules/azure_function_app | 5fe5d992a856636e2f49f6720a2b735dd77f1696 |

## Resources

No resources.

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_ai_connection_string"></a> [ai\_connection\_string](#input\_ai\_connection\_string) | The connection string to connect to application insights | `string` | n/a | yes |
| <a name="input_ai_instrumentation_key"></a> [ai\_instrumentation\_key](#input\_ai\_instrumentation\_key) | The key to connect to application insights | `string` | n/a | yes |
| <a name="input_ai_sampling_percentage"></a> [ai\_sampling\_percentage](#input\_ai\_sampling\_percentage) | The sampling percentage for application insights | `string` | n/a | yes |
| <a name="input_app_service_plan_id"></a> [app\_service\_plan\_id](#input\_app\_service\_plan\_id) | The app service plan where you want to host the functions | `string` | `null` | no |
| <a name="input_cidr_subnet_cgn_support_func"></a> [cidr\_subnet\_cgn\_support\_func](#input\_cidr\_subnet\_cgn\_support\_func) | CIDR block for cgn support function app subnet | `string` | `null` | no |
| <a name="input_cosmosdb_cgn_database_name"></a> [cosmosdb\_cgn\_database\_name](#input\_cosmosdb\_cgn\_database\_name) | Database name for CGN cosmosdb | `string` | n/a | yes |
| <a name="input_cosmosdb_cgn_key"></a> [cosmosdb\_cgn\_key](#input\_cosmosdb\_cgn\_key) | Connection key for CGN cosmosdb | `string` | n/a | yes |
| <a name="input_cosmosdb_cgn_uri"></a> [cosmosdb\_cgn\_uri](#input\_cosmosdb\_cgn\_uri) | Connection uri for CGN cosmosdb | `string` | n/a | yes |
| <a name="input_domain"></a> [domain](#input\_domain) | Domain | `string` | n/a | yes |
| <a name="input_env_short"></a> [env\_short](#input\_env\_short) | Short environment | `string` | n/a | yes |
| <a name="input_instance_number"></a> [instance\_number](#input\_instance\_number) | The istance number to create | `string` | n/a | yes |
| <a name="input_location"></a> [location](#input\_location) | Azure region | `string` | n/a | yes |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | IO Prefix | `string` | n/a | yes |
| <a name="input_private_dns_zone_resource_group_name"></a> [private\_dns\_zone\_resource\_group\_name](#input\_private\_dns\_zone\_resource\_group\_name) | Resource group name of the private DNS zone to use for private endpoints | `string` | n/a | yes |
| <a name="input_private_endpoint_subnet_id"></a> [private\_endpoint\_subnet\_id](#input\_private\_endpoint\_subnet\_id) | Private Endpoints subnet Id | `string` | n/a | yes |
| <a name="input_project"></a> [project](#input\_project) | IO prefix and short environment | `string` | n/a | yes |
| <a name="input_resource_group_name"></a> [resource\_group\_name](#input\_resource\_group\_name) | Name of the resource group where resources will be created | `string` | n/a | yes |
| <a name="input_storage_cgn_connection_string"></a> [storage\_cgn\_connection\_string](#input\_storage\_cgn\_connection\_string) | CGN storage connection key | `string` | n/a | yes |
| <a name="input_subnet_id"></a> [subnet\_id](#input\_subnet\_id) | A predefined subnet id | `string` | `null` | no |
| <a name="input_table_cgn_expiration"></a> [table\_cgn\_expiration](#input\_table\_cgn\_expiration) | CGN expiration table name | `string` | n/a | yes |
| <a name="input_table_eyca_expiration"></a> [table\_eyca\_expiration](#input\_table\_eyca\_expiration) | EYCA expiration table name | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | Resource tags | `map(any)` | n/a | yes |
| <a name="input_virtual_network"></a> [virtual\_network](#input\_virtual\_network) | Virtual network to create subnet in | <pre>object({<br/>    name                = string<br/>    resource_group_name = string<br/>  })</pre> | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_function_app_cgn_support"></a> [function\_app\_cgn\_support](#output\_function\_app\_cgn\_support) | n/a |
<!-- END_TF_DOCS -->
