terraform {

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "<= 3.116.0"
    }

    github = {
      source  = "integrations/github"
      version = "5.45.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfinfprodesercenti"
    container_name       = "terraform-state"
    key                  = "io-pe-cgn.repository.prod.tfstate"
  }
}

provider "azurerm" {
  features {
  }
}

provider "github" {
  owner = "pagopa"
}

module "repo_environment" {
  source    = "../_modules/repo_environment"
  env       = "prod"
  env_short = "p"
  domain    = "pe-cgn"

  repository = "io-cgn"
}
