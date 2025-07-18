# vpn

<!-- BEGIN_TF_DOCS -->
## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_azuread"></a> [azuread](#provider\_azuread) | 3.0.2 |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_dns_forwarder"></a> [dns\_forwarder](#module\_dns\_forwarder) | github.com/pagopa/terraform-azurerm-v4//dns_forwarder | v1.1.0 |
| <a name="module_dns_forwarder_snet"></a> [dns\_forwarder\_snet](#module\_dns\_forwarder\_snet) | github.com/pagopa/terraform-azurerm-v4//subnet | v1.1.0 |
| <a name="module_vpn"></a> [vpn](#module\_vpn) | github.com/pagopa/terraform-azurerm-v4//vpn_gateway | v1.1.0 |
| <a name="module_vpn_snet"></a> [vpn\_snet](#module\_vpn\_snet) | github.com/pagopa/terraform-azurerm-v4//subnet | v1.1.0 |

## Resources

| Name | Type |
|------|------|
| [azuread_application.vpn_app](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/data-sources/application) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_dnsforwarder_cidr_subnet"></a> [dnsforwarder\_cidr\_subnet](#input\_dnsforwarder\_cidr\_subnet) | DNS Forwarder network address space. | `list(string)` | n/a | yes |
| <a name="input_env_short"></a> [env\_short](#input\_env\_short) | n/a | `string` | n/a | yes |
| <a name="input_location"></a> [location](#input\_location) | Azure region | `string` | n/a | yes |
| <a name="input_location_short"></a> [location\_short](#input\_location\_short) | Azure region short name | `string` | n/a | yes |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | Prefix for resources | `string` | n/a | yes |
| <a name="input_project"></a> [project](#input\_project) | IO prefix, short environment and short location | `string` | n/a | yes |
| <a name="input_resource_group_name"></a> [resource\_group\_name](#input\_resource\_group\_name) | Resource group name for VNet | `string` | n/a | yes |
| <a name="input_subscription_current"></a> [subscription\_current](#input\_subscription\_current) | Current subscription information | `any` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | Resource tags | `map(any)` | n/a | yes |
| <a name="input_virtual_network"></a> [virtual\_network](#input\_virtual\_network) | Information of the common VNet | <pre>object({<br/>    id                  = string<br/>    name                = string<br/>    address_space       = list(string)<br/>    resource_group_name = string<br/>  })</pre> | n/a | yes |
| <a name="input_vpn_cidr_subnet"></a> [vpn\_cidr\_subnet](#input\_vpn\_cidr\_subnet) | VPN network address space. | `list(string)` | n/a | yes |
| <a name="input_vpn_pip_sku"></a> [vpn\_pip\_sku](#input\_vpn\_pip\_sku) | VPN GW PIP SKU | `string` | `"Standard"` | no |
| <a name="input_vpn_sku"></a> [vpn\_sku](#input\_vpn\_sku) | VPN Gateway SKU | `string` | `"VpnGw1"` | no |

## Outputs

No outputs.
<!-- END_TF_DOCS -->
