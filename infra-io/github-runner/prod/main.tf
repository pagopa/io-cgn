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
    key                  = "io-cgn.github-runner.prod.tfstate"
  }
}

provider "azurerm" {
  features {
  }
}

module "container_app_job_selfhosted_runner" {
  source = "github.com/pagopa/dx//infra/modules/github_selfhosted_runner_on_container_app_jobs?ref=main"

  prefix    = local.prefix
  env_short = local.env_short

  repo_name = local.repo_name

  container_app_environment = {
    name                = "${local.prefix}-${local.env_short}-github-runner-cae"
    resource_group_name = "${local.prefix}-${local.env_short}-github-runner-rg"
  }

  key_vault = {
    name                = "${local.prefix}-${local.env_short}-kv-common"
    resource_group_name = "${local.prefix}-${local.env_short}-rg-common"
  }

  tags = local.tags
}

