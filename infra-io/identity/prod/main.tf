terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "<= 3.116.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfappprodio"
    container_name       = "terraform-state"
    key                  = "io-cgn.identity.prod.tfstate"
  }
}

provider "azurerm" {
  features {
  }
}

module "federated_identities" {
  source = "github.com/pagopa/dx//infra/modules/azure_federated_identity_with_github?ref=main"

  prefix    = local.prefix
  env_short = local.env_short
  env       = "io-${local.env}"
  domain    = local.domain
  location  = local.location

  repositories = [local.repo_name]

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
  source = "github.com/pagopa/dx//infra/modules/azure_federated_identity_with_github?ref=main"

  prefix       = local.prefix
  env_short    = local.env_short
  env          = "io-app-${local.env}"
  domain       = "${local.domain}-app"
  repositories = [local.repo_name]
  location     = local.location
  tags         = local.tags

  continuos_integration = { enable = false }
}
