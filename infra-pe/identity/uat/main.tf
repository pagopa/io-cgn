terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.81"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfinfuatesercenti"
    container_name       = "terraform-state"
    key                  = "io-pe-cgn.identity.uat.tfstate"
  }
}

provider "azurerm" {
  features {
  }
}

module "federated_identities" {
  source  = "pagopa-dx/azure-federated-identity-with-github/azurerm"
  version = "4.0.0"

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location
    domain          = local.domain
    instance_number = "01"
  }

  repository = {
    name = local.repo_name
  }

  resource_group_name = local.identity_resource_group_name
  subscription_id     = data.azurerm_subscription.current.id

  continuos_delivery = {
    enable = true,
    roles  = local.environment_cd_roles
  }

  continuos_integration = {
    enable = true,
    roles  = local.environment_ci_roles
  }

  tags = local.tags
}

module "app_federated_identities" {
  source  = "pagopa-dx/azure-federated-identity-with-github/azurerm"
  version = "4.0.0"

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location
    domain          = local.domain
    instance_number = "01"
  }

  repository = {
    name = local.repo_name
  }

  resource_group_name = local.identity_resource_group_name
  subscription_id     = data.azurerm_subscription.current.id

  identity_type = "app"

  continuos_integration = { enable = false }
  continuos_delivery = {
    enable = true,
    roles  = local.environment_app_cd_roles
  }

  tags = local.tags
}
