data "azurerm_user_assigned_identity" "identity_ci" {
  name                = "io-${var.env_short}-pe-cgn-github-ci-identity"
  resource_group_name = local.identity_resource_group_name
}

data "azurerm_user_assigned_identity" "identity_cd" {
  name                = "io-${var.env_short}-pe-cgn-github-cd-identity"
  resource_group_name = local.identity_resource_group_name
}

data "azurerm_user_assigned_identity" "identity_app_cd" {
  name                = "io-${var.env_short}-pe-cgn-app-github-cd-identity"
  resource_group_name = local.identity_resource_group_name
}

data "github_organization_teams" "all" {
  root_teams_only = true
  summary_only    = true
}

data "azurerm_client_config" "current" {}

data "azurerm_subscription" "current" {}
