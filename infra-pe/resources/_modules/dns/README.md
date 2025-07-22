# dns

<!-- BEGIN_TF_DOCS -->
## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_azurerm"></a> [azurerm](#provider\_azurerm) | 4.14.0 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [azurerm_private_dns_zone.private_dns_zones](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/private_dns_zone) | resource |
| [azurerm_private_dns_zone_virtual_network_link.private_dns_links](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/private_dns_zone_virtual_network_link) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_override_link_names"></a> [override\_link\_names](#input\_override\_link\_names) | Override link names | `map(string)` | `{}` | no |
| <a name="input_private_dns_zones"></a> [private\_dns\_zones](#input\_private\_dns\_zones) | Private DNS zones | `map(any)` | <pre>{<br/>  "azure_api_net": "azure-api.net",<br/>  "azurewebsites": "privatelink.azurewebsites.net",<br/>  "blob": "privatelink.blob.core.windows.net",<br/>  "documents": "privatelink.documents.azure.com",<br/>  "file": "privatelink.file.core.windows.net",<br/>  "management_azure_api_net": "management.azure-api.net",<br/>  "psql": "privatelink.postgres.database.azure.com",<br/>  "queue": "privatelink.queue.core.windows.net",<br/>  "redis": "privatelink.redis.cache.windows.net",<br/>  "scm_azure_api_net": "scm.azure-api.net",<br/>  "servicebus": "privatelink.servicebus.windows.net",<br/>  "srch": "privatelink.search.windows.net",<br/>  "table": "privatelink.table.core.windows.net",<br/>  "vault": "privatelink.vaultcore.azure.net"<br/>}</pre> | no |
| <a name="input_resource_group_name"></a> [resource\_group\_name](#input\_resource\_group\_name) | Resource group name | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | Resources tags | `map(any)` | n/a | yes |
| <a name="input_virtual_network"></a> [virtual\_network](#input\_virtual\_network) | Virtual network where to attach private dns zones | <pre>object({<br/>    id   = string<br/>    name = string<br/>  })</pre> | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_private_dns_zones"></a> [private\_dns\_zones](#output\_private\_dns\_zones) | n/a |
<!-- END_TF_DOCS -->
