locals {
  repository = "io-cgn"
  env_short  = "p"
  env        = "prod"
  domain     = "io-cgn"
  project    = "${local.domain}-${local.env_short}"

  identity_resource_group_name = "${local.project}-identity-rg"

  repo_secrets = {
    "ARM_TENANT_ID"       = data.azurerm_client_config.current.tenant_id,
    "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
  }

  pe_ci = {
    secrets = {
      "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.identity_ci.client_id
    }
  }

  pe_cd = {
    secrets = {
      "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.identity_cd.client_id
    }

    reviewers_teams = ["io-cgn-contributors", "engineering-team-cloud-eng"]
  }

  pe_app_cd = {
    secrets = {
      "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.identity_app_cd.client_id
    }

    reviewers_teams = ["io-cgn-contributors", "engineering-team-cloud-eng"]
  }
}
