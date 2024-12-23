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
  source = "github.com/pagopa/dx//infra/modules/github_selfhosted_runner_on_container_app_jobs?ref=gh-runner-labels-can-be-overridden"

  resource_group_name = "${local.prefix}-${local.env_short}-itn-cgn-rg-01"

  environment = {
    prefix    = local.prefix
    env_short = local.env_short
    location  = "italynorth"
    instance_number = "01"
  }

  repository = {
    name = local.repo_name
  }

  container_app_environment = {
    id                  = data.azurerm_container_app_environment.cae.id
    location            = data.azurerm_container_app_environment.cae.location
    use_labels          = true
    override_labels     = ["${local.prefix}-${local.env}"]
  }

  key_vault = {
    name                = "${local.prefix}-${local.env_short}-kv-common"
    resource_group_name = "${local.prefix}-${local.env_short}-rg-common"
  }

  tags = local.tags
}
