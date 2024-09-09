locals {
  repository = "io-cgn"

  project = "io-p"

  identity_resource_group_name = "${local.project}-identity-rg"

  repo_secrets = {
    "ARM_TENANT_ID"       = data.azurerm_client_config.current.tenant_id,
    "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
  }

  ci = {
    secrets = {
      "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.identity_prod_ci.client_id
    }
  }

  cd = {
    secrets = {
      "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.identity_prod_cd.client_id
    }

    reviewers_teams = ["io-cgn-contributors", "engineering-team-cloud-eng"]
  }

  app_cd = {
    secrets = {
      "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.identity_app_prod_cd.client_id
    }

    reviewers_teams = ["io-cgn-contributors", "engineering-team-cloud-eng"]
  }
}
