data "azurerm_user_assigned_identity" "identity_prod_ci" {
  name                = "io-p-itn-cgn-infra-github-ci-id-01"
  resource_group_name = local.identity_resource_group_name
}

data "azurerm_user_assigned_identity" "identity_prod_cd" {
  name                = "io-p-itn-cgn-infra-github-cd-id-01"
  resource_group_name = local.identity_resource_group_name
}

data "azurerm_user_assigned_identity" "identity_app_prod_cd" {
  name                = "io-p-itn-cgn-app-github-cd-id-01"
  resource_group_name = local.identity_resource_group_name
}

data "github_organization_teams" "all" {
  root_teams_only = true
  summary_only    = true
}
