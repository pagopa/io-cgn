# The module federates infra-*/app-* GitHub environments; the workflows use pe-* ones.
resource "azurerm_federated_identity_credential" "pe_ci" {
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  name                = "${local.repo_name}-environment-pe-${local.env}-ci"
  parent_id           = module.federated_identities.federated_ci_identity.id
  resource_group_name = local.identity_resource_group_name
  subject             = "repo:pagopa/${local.repo_name}:environment:pe-${local.env}-ci"
}

resource "azurerm_federated_identity_credential" "pe_cd" {
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  name                = "${local.repo_name}-environment-pe-${local.env}-cd"
  parent_id           = module.federated_identities.federated_cd_identity.id
  resource_group_name = local.identity_resource_group_name
  subject             = "repo:pagopa/${local.repo_name}:environment:pe-${local.env}-cd"
}

resource "azurerm_federated_identity_credential" "pe_app_cd" {
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  name                = "${local.repo_name}-environment-pe-app-${local.env}-cd"
  parent_id           = module.app_federated_identities.federated_cd_identity.id
  resource_group_name = local.identity_resource_group_name
  subject             = "repo:pagopa/${local.repo_name}:environment:pe-app-${local.env}-cd"
}
