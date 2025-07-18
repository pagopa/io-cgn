# networking

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
| <a name="module_pep_snet"></a> [pep\_snet](#module\_pep\_snet) | github.com/pagopa/terraform-azurerm-v4//subnet | v1.1.0 |
| <a name="module_vnet_common"></a> [vnet\_common](#module\_vnet\_common) | github.com/pagopa/terraform-azurerm-v4//virtual_network | v1.1.0 |

## Resources

| Name | Type |
|------|------|
| [azurerm_virtual_network_peering.itn_weu](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/virtual_network_peering) | resource |
| [azurerm_virtual_network.weu](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/virtual_network) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_ddos_protection_enabled"></a> [ddos\_protection\_enabled](#input\_ddos\_protection\_enabled) | Enable DDoS protection | `bool` | `true` | no |
| <a name="input_domain"></a> [domain](#input\_domain) | Domain | `string` | n/a | yes |
| <a name="input_env_short"></a> [env\_short](#input\_env\_short) | Short environment name | `string` | n/a | yes |
| <a name="input_location"></a> [location](#input\_location) | Azure region | `string` | n/a | yes |
| <a name="input_location_short"></a> [location\_short](#input\_location\_short) | Azure region short name | `string` | n/a | yes |
| <a name="input_pep_snet_cidr"></a> [pep\_snet\_cidr](#input\_pep\_snet\_cidr) | CIDR block allocated in the private endpoints subnet | `list(string)` | n/a | yes |
| <a name="input_project"></a> [project](#input\_project) | IO prefix, short environment and short location | `string` | n/a | yes |
| <a name="input_resource_group_name"></a> [resource\_group\_name](#input\_resource\_group\_name) | Resource group name for VNet | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | Resource tags | `map(any)` | n/a | yes |
| <a name="input_vnet_cidr_block"></a> [vnet\_cidr\_block](#input\_vnet\_cidr\_block) | CIDR block allocated in the common vnet | `string` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_pep_snet"></a> [pep\_snet](#output\_pep\_snet) | n/a |
| <a name="output_vnet_common"></a> [vnet\_common](#output\_vnet\_common) | n/a |
<!-- END_TF_DOCS -->
