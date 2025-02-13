# IO CGN - GitHub federated Managed Identities

<!-- markdownlint-disable -->
<!-- BEGINNING OF PRE-COMMIT-TERRAFORM DOCS HOOK -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_azurerm"></a> [azurerm](#requirement\_azurerm) | <= 3.116.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_azurerm.peprod"></a> [azurerm.peprod](#provider\_azurerm.peprod) | 3.116.0 |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_app_federated_identities"></a> [app\_federated\_identities](#module\_app\_federated\_identities) | github.com/pagopa/dx//infra/modules/azure_federated_identity_with_github | main |
| <a name="module_federated_identities"></a> [federated\_identities](#module\_federated\_identities) | github.com/pagopa/dx//infra/modules/azure_federated_identity_with_github | main |

## Resources

| Name | Type |
|------|------|
| [azurerm_role_assignment.cd_cgn](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_role_assignment.ci_cgn](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/role_assignment) | resource |
| [azurerm_subscription.cgn](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/subscription) | data source |

## Inputs

No inputs.

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_federated_cd_identity"></a> [federated\_cd\_identity](#output\_federated\_cd\_identity) | n/a |
| <a name="output_federated_ci_identity"></a> [federated\_ci\_identity](#output\_federated\_ci\_identity) | n/a |
<!-- END OF PRE-COMMIT-TERRAFORM DOCS HOOK -->
