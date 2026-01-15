resource "azurerm_federated_identity_credential" "io_app_prod_ci" {
  audience            = local.audience
  issuer              = local.issuer
  name                = "io-cgn-environment-io-app-prod-ci"
  parent_id           = module.app_federated_identities.federated_ci_identity.id
  resource_group_name = azurerm_resource_group.cgn_itn_01.name
  subject             = "repo:pagopa/io-cgn:environment:io-app-prod-ci"
}

resource "azurerm_federated_identity_credential" "io_app_prod_cd" {
  audience            = local.audience
  issuer              = local.issuer
  name                = "io-cgn-environment-io-app-prod-cd"
  parent_id           = module.app_federated_identities.federated_cd_identity.id
  resource_group_name = azurerm_resource_group.cgn_itn_01.name
  subject             = "repo:pagopa/io-cgn:environment:io-app-prod-cd"
}

resource "azurerm_federated_identity_credential" "io_infra_prod_ci" {
  audience            = local.audience
  issuer              = local.issuer
  name                = "io-cgn-environment-io-infra-prod-ci"
  parent_id           = module.federated_identities.federated_ci_identity.id
  resource_group_name = azurerm_resource_group.cgn_itn_01.name
  subject             = "repo:pagopa/io-cgn:environment:io-prod-ci"
}

resource "azurerm_federated_identity_credential" "io_infra_prod_cd" {
  audience            = local.audience
  issuer              = local.issuer
  name                = "io-cgn-environment-io-infra-prod-cd"
  parent_id           = module.federated_identities.federated_cd_identity.id
  resource_group_name = azurerm_resource_group.cgn_itn_01.name
  subject             = "repo:pagopa/io-cgn:environment:io-prod-cd"
}
