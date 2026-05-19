data "azurerm_user_assigned_identity" "ci" {
  provider            = azurerm   # PE subscription
  name                = module.federated_identities.federated_ci_identity.name
  resource_group_name = module.federated_identities.federated_ci_identity.resource_group_name
}

data "azurerm_user_assigned_identity" "cd" {
  provider            = azurerm   # PE subscription
  name                = module.federated_identities.federated_cd_identity.name
  resource_group_name = module.federated_identities.federated_cd_identity.resource_group_name
}