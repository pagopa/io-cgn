# app_service_onboarding_portal_backend

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
| <a name="module_app_service_onboarding_portal_backend"></a> [app\_service\_onboarding\_portal\_backend](#module\_app\_service\_onboarding\_portal\_backend) | github.com/pagopa/dx//infra/modules/azure_app_service | main |

## Resources

| Name | Type |
|------|------|
| [azurerm_private_dns_a_record.weu_pep](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/private_dns_a_record) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_active_directory_id"></a> [active\_directory\_id](#input\_active\_directory\_id) | Active Directory client id | `string` | n/a | yes |
| <a name="input_active_directory_well_known"></a> [active\_directory\_well\_known](#input\_active\_directory\_well\_known) | Active Directory .well-known url | `string` | n/a | yes |
| <a name="input_ai_connection_string"></a> [ai\_connection\_string](#input\_ai\_connection\_string) | The connection string to connect to application insights | `string` | n/a | yes |
| <a name="input_ai_instrumentation_key"></a> [ai\_instrumentation\_key](#input\_ai\_instrumentation\_key) | The key to connect to application insights | `string` | n/a | yes |
| <a name="input_ai_sampling_percentage"></a> [ai\_sampling\_percentage](#input\_ai\_sampling\_percentage) | The sampling percentage for application insights | `string` | n/a | yes |
| <a name="input_appinsights_instrumentationkey"></a> [appinsights\_instrumentationkey](#input\_appinsights\_instrumentationkey) | Application insights instrumentation key | `string` | n/a | yes |
| <a name="input_azure_subscription_id"></a> [azure\_subscription\_id](#input\_azure\_subscription\_id) | APIM subscription id | `string` | n/a | yes |
| <a name="input_cgn_apim_productid"></a> [cgn\_apim\_productid](#input\_cgn\_apim\_productid) | CGN APIM product id | `string` | n/a | yes |
| <a name="input_cgn_apim_resource"></a> [cgn\_apim\_resource](#input\_cgn\_apim\_resource) | CGN APIM resource name | `string` | n/a | yes |
| <a name="input_cgn_apim_resourcegroup"></a> [cgn\_apim\_resourcegroup](#input\_cgn\_apim\_resourcegroup) | CGN APIM resource group name | `string` | n/a | yes |
| <a name="input_cgn_attribute_authority_base_url"></a> [cgn\_attribute\_authority\_base\_url](#input\_cgn\_attribute\_authority\_base\_url) | Attribute Authority base url | `string` | n/a | yes |
| <a name="input_cgn_email_department_email"></a> [cgn\_email\_department\_email](#input\_cgn\_email\_department\_email) | Department email address | `string` | n/a | yes |
| <a name="input_cgn_email_portal_base_url"></a> [cgn\_email\_portal\_base\_url](#input\_cgn\_email\_portal\_base\_url) | Redirect url inside email | `string` | n/a | yes |
| <a name="input_cgn_geolocation_secret_token"></a> [cgn\_geolocation\_secret\_token](#input\_cgn\_geolocation\_secret\_token) | Geolocation secret token | `string` | n/a | yes |
| <a name="input_cgn_pe_storage_azure_account_key"></a> [cgn\_pe\_storage\_azure\_account\_key](#input\_cgn\_pe\_storage\_azure\_account\_key) | Storage account key | `string` | n/a | yes |
| <a name="input_cgn_pe_storage_azure_account_name"></a> [cgn\_pe\_storage\_azure\_account\_name](#input\_cgn\_pe\_storage\_azure\_account\_name) | Storage account name | `string` | n/a | yes |
| <a name="input_cgn_pe_storage_azure_blob_endpoint"></a> [cgn\_pe\_storage\_azure\_blob\_endpoint](#input\_cgn\_pe\_storage\_azure\_blob\_endpoint) | Storage account blob endpoint | `string` | n/a | yes |
| <a name="input_cgn_portal_base_url"></a> [cgn\_portal\_base\_url](#input\_cgn\_portal\_base\_url) | CGN portal base url | `string` | n/a | yes |
| <a name="input_cgn_recaptcha_secret_key"></a> [cgn\_recaptcha\_secret\_key](#input\_cgn\_recaptcha\_secret\_key) | Recaptcha secret key | `string` | n/a | yes |
| <a name="input_cidr_subnet_cgn_onboarding_portal_backend"></a> [cidr\_subnet\_cgn\_onboarding\_portal\_backend](#input\_cidr\_subnet\_cgn\_onboarding\_portal\_backend) | CIDR block for onboarding portal backend app service subnet | `string` | n/a | yes |
| <a name="input_docker_registry_server_password"></a> [docker\_registry\_server\_password](#input\_docker\_registry\_server\_password) | Docker container registry password | `string` | n/a | yes |
| <a name="input_docker_registry_server_url"></a> [docker\_registry\_server\_url](#input\_docker\_registry\_server\_url) | Docker container registry url | `string` | n/a | yes |
| <a name="input_docker_registry_server_username"></a> [docker\_registry\_server\_username](#input\_docker\_registry\_server\_username) | Docker container registry username | `string` | n/a | yes |
| <a name="input_domain"></a> [domain](#input\_domain) | Domain | `string` | n/a | yes |
| <a name="input_env_short"></a> [env\_short](#input\_env\_short) | Short environment | `string` | n/a | yes |
| <a name="input_environment"></a> [environment](#input\_environment) | Application environment uat\|prod | `string` | n/a | yes |
| <a name="input_eyca_export_enabled"></a> [eyca\_export\_enabled](#input\_eyca\_export\_enabled) | Is eyca export enabled? | `bool` | n/a | yes |
| <a name="input_eyca_export_password"></a> [eyca\_export\_password](#input\_eyca\_export\_password) | CCDB password | `string` | n/a | yes |
| <a name="input_eyca_export_username"></a> [eyca\_export\_username](#input\_eyca\_export\_username) | CCDB username | `string` | n/a | yes |
| <a name="input_jwt_private_key"></a> [jwt\_private\_key](#input\_jwt\_private\_key) | Private key to sign JWT | `string` | n/a | yes |
| <a name="input_jwt_public_key"></a> [jwt\_public\_key](#input\_jwt\_public\_key) | Public key to verify JWT signature | `string` | n/a | yes |
| <a name="input_location"></a> [location](#input\_location) | Azure region | `string` | n/a | yes |
| <a name="input_min_bucket_csv_rows"></a> [min\_bucket\_csv\_rows](#input\_min\_bucket\_csv\_rows) | The minimun amount of rows to load a csv bucket file | `string` | `"10000"` | no |
| <a name="input_onboarding_portal_backend_tier"></a> [onboarding\_portal\_backend\_tier](#input\_onboarding\_portal\_backend\_tier) | The tier for onboarding portal backend app service | `string` | n/a | yes |
| <a name="input_one_identity_base_url"></a> [one\_identity\_base\_url](#input\_one\_identity\_base\_url) | One Identity server base url | `string` | n/a | yes |
| <a name="input_one_identity_id"></a> [one\_identity\_id](#input\_one\_identity\_id) | One Identity client id | `string` | n/a | yes |
| <a name="input_one_identity_secret"></a> [one\_identity\_secret](#input\_one\_identity\_secret) | One Identity client secret | `string` | n/a | yes |
| <a name="input_one_identity_well_known"></a> [one\_identity\_well\_known](#input\_one\_identity\_well\_known) | One Identity .well-known url | `string` | n/a | yes |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | IO Prefix | `string` | n/a | yes |
| <a name="input_private_dns_zone_resource_group_name"></a> [private\_dns\_zone\_resource\_group\_name](#input\_private\_dns\_zone\_resource\_group\_name) | Resource group name of the private DNS zone to use for private endpoints | `string` | n/a | yes |
| <a name="input_private_endpoint_subnet_id"></a> [private\_endpoint\_subnet\_id](#input\_private\_endpoint\_subnet\_id) | Private Endpoints subnet Id | `string` | n/a | yes |
| <a name="input_project"></a> [project](#input\_project) | IO prefix and short environment | `string` | n/a | yes |
| <a name="input_resource_group_name"></a> [resource\_group\_name](#input\_resource\_group\_name) | Name of the resource group where resources will be created | `string` | n/a | yes |
| <a name="input_spring_datasource_password"></a> [spring\_datasource\_password](#input\_spring\_datasource\_password) | Spring datasource password | `string` | n/a | yes |
| <a name="input_spring_datasource_url"></a> [spring\_datasource\_url](#input\_spring\_datasource\_url) | Spring datasource url | `string` | n/a | yes |
| <a name="input_spring_datasource_username"></a> [spring\_datasource\_username](#input\_spring\_datasource\_username) | Spring datasource username | `string` | n/a | yes |
| <a name="input_spring_mail_host"></a> [spring\_mail\_host](#input\_spring\_mail\_host) | Mailer host | `string` | n/a | yes |
| <a name="input_spring_mail_password"></a> [spring\_mail\_password](#input\_spring\_mail\_password) | Mailer password | `string` | n/a | yes |
| <a name="input_spring_mail_port"></a> [spring\_mail\_port](#input\_spring\_mail\_port) | Mailer port | `string` | n/a | yes |
| <a name="input_spring_mail_username"></a> [spring\_mail\_username](#input\_spring\_mail\_username) | Mailer username | `string` | n/a | yes |
| <a name="input_spring_quartz_autostartup"></a> [spring\_quartz\_autostartup](#input\_spring\_quartz\_autostartup) | Is quartz scheduled enabled? | `bool` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | Resource tags | `map(any)` | n/a | yes |
| <a name="input_virtual_network"></a> [virtual\_network](#input\_virtual\_network) | Virtual network to create subnet in | <pre>object({<br/>    name                = string<br/>    resource_group_name = string<br/>  })</pre> | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_app_service_onboarding_portal_backend"></a> [app\_service\_onboarding\_portal\_backend](#output\_app\_service\_onboarding\_portal\_backend) | n/a |
<!-- END_TF_DOCS -->
