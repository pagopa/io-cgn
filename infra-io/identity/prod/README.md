# IO CGN - GitHub federated Managed Identities

<!-- markdownlint-disable -->
<!-- BEGIN_TF_DOCS -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_azurerm"></a> [azurerm](#requirement\_azurerm) | ~> 4.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_azurerm"></a> [azurerm](#provider\_azurerm) | 4.24.0 |
| <a name="provider_azurerm.peprod"></a> [azurerm.peprod](#provider\_azurerm.peprod) | 4.24.0 |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_app_federated_identities"></a> [app\_federated\_identities](#module\_app\_federated\_identities) | pagopa-dx/azure-federated-identity-with-github/azurerm | ~> 1.0 |
| <a name="module_federated_identities"></a> [federated\_identities](#module\_federated\_identities) | pagopa-dx/azure-federated-identity-with-github/azurerm | ~> 1.0 |

## Resources

| Name | Type |
|------|------|
| [azurerm_federated_identity_credential.io_app_prod_cd](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/federated_identity_credential) | resource |
| [azurerm_federated_identity_credential.io_infra_prod_cd](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/federated_identity_credential) | resource |
| [azurerm_federated_identity_credential.io_infra_prod_ci](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/federated_identity_credential) | resource |
| [azurerm_resource_group.cgn_itn_01](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/resource_group) | resource |
| [azurerm_role_assignment.cd_cgn](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_role_assignment.ci_cgn](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_subscription.cgn](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/subscription) | data source |
| [azurerm_subscription.current](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/subscription) | data source |

## Inputs

No inputs.

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_federated_cd_identity"></a> [federated\_cd\_identity](#output\_federated\_cd\_identity) | n/a |
| <a name="output_federated_ci_identity"></a> [federated\_ci\_identity](#output\_federated\_ci\_identity) | n/a |
<!-- END_TF_DOCS -->
