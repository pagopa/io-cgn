data "azurerm_user_assigned_identity" "identity_ci" {
  name                = "io-${var.env_short}-itn-pe-cgn-infra-github-ci-id-01"
  resource_group_name = local.identity_resource_group_name
}

data "azurerm_user_assigned_identity" "identity_cd" {
  name                = "io-${var.env_short}-itn-pe-cgn-infra-github-cd-id-01"
  resource_group_name = local.identity_resource_group_name
}

data "azurerm_user_assigned_identity" "identity_app_cd" {
  name                = "io-${var.env_short}-itn-pe-cgn-app-github-cd-id-01"
  resource_group_name = local.identity_resource_group_name
}

data "github_organization_teams" "all" {
  root_teams_only = true
  summary_only    = true
}

data "azurerm_client_config" "current" {}

data "azurerm_subscription" "current" {}
