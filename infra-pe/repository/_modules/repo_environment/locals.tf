locals {
  project = "${var.prefix}-${var.domain}-${var.env_short}"

  identity_resource_group_name = "${var.prefix}-${var.env_short}-identity-rg"

  repo_secrets = {
  }

  ci = {
    secrets = {
      "ARM_CLIENT_ID"       = data.azurerm_user_assigned_identity.identity_ci.client_id
      "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      "ARM_TENANT_ID" = data.azurerm_client_config.current.tenant_id
    }
  }

  cd = {
    secrets = {
      "ARM_CLIENT_ID"       = data.azurerm_user_assigned_identity.identity_cd.client_id
      "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      "ARM_TENANT_ID" = data.azurerm_client_config.current.tenant_id
    }

    reviewers_teams = ["io-cgn-contributors", "engineering-team-cloud-eng"]
  }

  app_cd = {
    secrets = {
      "ARM_CLIENT_ID"       = data.azurerm_user_assigned_identity.identity_app_cd.client_id
      "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      "ARM_TENANT_ID" = data.azurerm_client_config.current.tenant_id
    }

    reviewers_teams = ["io-cgn-contributors", "engineering-team-cloud-eng"]
  }
}
