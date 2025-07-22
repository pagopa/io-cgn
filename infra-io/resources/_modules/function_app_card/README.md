# function_app_card

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
| <a name="module_function_app_cgn_card"></a> [function\_app\_cgn\_card](#module\_function\_app\_cgn\_card) | github.com/pagopa/dx//infra/modules/azure_function_app | 5fe5d992a856636e2f49f6720a2b735dd77f1696 |

## Resources

| Name | Type |
|------|------|
| [azurerm_subnet_nat_gateway_association.functions_messages_citizen_subnet](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/subnet_nat_gateway_association) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_activated_cgn_queue_name"></a> [activated\_cgn\_queue\_name](#input\_activated\_cgn\_queue\_name) | Activated CGN queue name | `string` | n/a | yes |
| <a name="input_activated_eyca_queue_name"></a> [activated\_eyca\_queue\_name](#input\_activated\_eyca\_queue\_name) | Activated EYCA queue name | `string` | n/a | yes |
| <a name="input_ai_connection_string"></a> [ai\_connection\_string](#input\_ai\_connection\_string) | The connection string to connect to application insights | `string` | n/a | yes |
| <a name="input_ai_instrumentation_key"></a> [ai\_instrumentation\_key](#input\_ai\_instrumentation\_key) | The key to connect to application insights | `string` | n/a | yes |
| <a name="input_ai_sampling_percentage"></a> [ai\_sampling\_percentage](#input\_ai\_sampling\_percentage) | The sampling percentage for application insights | `string` | n/a | yes |
| <a name="input_app_service_plan_id"></a> [app\_service\_plan\_id](#input\_app\_service\_plan\_id) | The app service plan where you want to host the functions | `string` | `null` | no |
| <a name="input_cgn_legal_backup_container_name"></a> [cgn\_legal\_backup\_container\_name](#input\_cgn\_legal\_backup\_container\_name) | Legal backup container name | `string` | n/a | yes |
| <a name="input_cgn_legal_backup_folder_name"></a> [cgn\_legal\_backup\_folder\_name](#input\_cgn\_legal\_backup\_folder\_name) | Legal backup folder name | `string` | n/a | yes |
| <a name="input_cgn_legal_backup_storage_connection"></a> [cgn\_legal\_backup\_storage\_connection](#input\_cgn\_legal\_backup\_storage\_connection) | Legal backup storage connection string | `string` | n/a | yes |
| <a name="input_cgn_service_id"></a> [cgn\_service\_id](#input\_cgn\_service\_id) | CGN service id | `string` | n/a | yes |
| <a name="input_cgn_upper_bound_age"></a> [cgn\_upper\_bound\_age](#input\_cgn\_upper\_bound\_age) | CGN upper bound age | `string` | n/a | yes |
| <a name="input_cidr_subnet_cgn_card_func"></a> [cidr\_subnet\_cgn\_card\_func](#input\_cidr\_subnet\_cgn\_card\_func) | CIDR block for cgn card function app subnet | `string` | `null` | no |
| <a name="input_cosmosdb_cgn_database_name"></a> [cosmosdb\_cgn\_database\_name](#input\_cosmosdb\_cgn\_database\_name) | Database name for CGN cosmosdb | `string` | n/a | yes |
| <a name="input_cosmosdb_cgn_key"></a> [cosmosdb\_cgn\_key](#input\_cosmosdb\_cgn\_key) | Connection key for CGN cosmosdb | `string` | n/a | yes |
| <a name="input_cosmosdb_cgn_uri"></a> [cosmosdb\_cgn\_uri](#input\_cosmosdb\_cgn\_uri) | Connection uri for CGN cosmosdb | `string` | n/a | yes |
| <a name="input_domain"></a> [domain](#input\_domain) | Domain | `string` | n/a | yes |
| <a name="input_env_short"></a> [env\_short](#input\_env\_short) | Short environment | `string` | n/a | yes |
| <a name="input_expired_cgn_queue_name"></a> [expired\_cgn\_queue\_name](#input\_expired\_cgn\_queue\_name) | Expired CGN queue name | `string` | n/a | yes |
| <a name="input_expired_eyca_queue_name"></a> [expired\_eyca\_queue\_name](#input\_expired\_eyca\_queue\_name) | Expired EYCA queue name | `string` | n/a | yes |
| <a name="input_eyca_api_base_url"></a> [eyca\_api\_base\_url](#input\_eyca\_api\_base\_url) | EYCA API base url | `string` | n/a | yes |
| <a name="input_eyca_api_password"></a> [eyca\_api\_password](#input\_eyca\_api\_password) | EYCA API password | `string` | n/a | yes |
| <a name="input_eyca_api_username"></a> [eyca\_api\_username](#input\_eyca\_api\_username) | EYCA API username | `string` | n/a | yes |
| <a name="input_eyca_upper_bound_age"></a> [eyca\_upper\_bound\_age](#input\_eyca\_upper\_bound\_age) | EYCA upper bound age | `string` | n/a | yes |
| <a name="input_instance_number"></a> [instance\_number](#input\_instance\_number) | The istance number to create | `string` | n/a | yes |
| <a name="input_location"></a> [location](#input\_location) | Azure region | `string` | n/a | yes |
| <a name="input_messages_queue_name"></a> [messages\_queue\_name](#input\_messages\_queue\_name) | Messages queue name | `string` | n/a | yes |
| <a name="input_nat_gateway_id"></a> [nat\_gateway\_id](#input\_nat\_gateway\_id) | The ID of the NAT Gateway | `string` | n/a | yes |
| <a name="input_otp_ttl_in_seconds"></a> [otp\_ttl\_in\_seconds](#input\_otp\_ttl\_in\_seconds) | OTP TTL in seconds for API integrated merchants | `string` | n/a | yes |
| <a name="input_pending_cgn_queue_name"></a> [pending\_cgn\_queue\_name](#input\_pending\_cgn\_queue\_name) | Pending CGN queue name | `string` | n/a | yes |
| <a name="input_pending_delete_cgn_queue_name"></a> [pending\_delete\_cgn\_queue\_name](#input\_pending\_delete\_cgn\_queue\_name) | Pending Delete CGN queue name | `string` | n/a | yes |
| <a name="input_pending_delete_eyca_queue_name"></a> [pending\_delete\_eyca\_queue\_name](#input\_pending\_delete\_eyca\_queue\_name) | Pending Delete EYCA queue name | `string` | n/a | yes |
| <a name="input_pending_eyca_queue_name"></a> [pending\_eyca\_queue\_name](#input\_pending\_eyca\_queue\_name) | Pending EYCA queue name | `string` | n/a | yes |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | IO Prefix | `string` | n/a | yes |
| <a name="input_private_dns_zone_resource_group_name"></a> [private\_dns\_zone\_resource\_group\_name](#input\_private\_dns\_zone\_resource\_group\_name) | Resource group name of the private DNS zone to use for private endpoints | `string` | n/a | yes |
| <a name="input_private_endpoint_subnet_id"></a> [private\_endpoint\_subnet\_id](#input\_private\_endpoint\_subnet\_id) | Private Endpoints subnet Id | `string` | n/a | yes |
| <a name="input_project"></a> [project](#input\_project) | IO prefix and short environment | `string` | n/a | yes |
| <a name="input_redis_password"></a> [redis\_password](#input\_redis\_password) | Redis password | `string` | n/a | yes |
| <a name="input_redis_port"></a> [redis\_port](#input\_redis\_port) | Redis port | `string` | n/a | yes |
| <a name="input_redis_url"></a> [redis\_url](#input\_redis\_url) | Redis url | `string` | n/a | yes |
| <a name="input_resource_group_name"></a> [resource\_group\_name](#input\_resource\_group\_name) | Name of the resource group where resources will be created | `string` | n/a | yes |
| <a name="input_services_api_key"></a> [services\_api\_key](#input\_services\_api\_key) | Services API key | `string` | n/a | yes |
| <a name="input_services_api_url"></a> [services\_api\_url](#input\_services\_api\_url) | Services API url | `string` | n/a | yes |
| <a name="input_storage_cgn_connection_string"></a> [storage\_cgn\_connection\_string](#input\_storage\_cgn\_connection\_string) | CGN storage connection key | `string` | n/a | yes |
| <a name="input_subnet_id"></a> [subnet\_id](#input\_subnet\_id) | A predefined subnet id | `string` | `null` | no |
| <a name="input_table_cgn_expiration"></a> [table\_cgn\_expiration](#input\_table\_cgn\_expiration) | CGN expiration table name | `string` | n/a | yes |
| <a name="input_table_eyca_expiration"></a> [table\_eyca\_expiration](#input\_table\_eyca\_expiration) | EYCA expiration table name | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | Resource tags | `map(any)` | n/a | yes |
| <a name="input_virtual_network"></a> [virtual\_network](#input\_virtual\_network) | Virtual network to create subnet in | <pre>object({<br/>    name                = string<br/>    resource_group_name = string<br/>  })</pre> | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_function_app_cgn_card"></a> [function\_app\_cgn\_card](#output\_function\_app\_cgn\_card) | n/a |
<!-- END_TF_DOCS -->
