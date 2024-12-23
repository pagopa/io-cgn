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
module "container_app_job" {
  source = "github.com/pagopa/terraform-azurerm-v3.git//container_app_job_gh_runner_v2?ref=v8.60.0"

  location            = "italynorth"
  prefix              = local.prefix
  env_short           = local.env_short
  resource_group_name = "${local.prefix}-${local.env_short}-itn-github-runner-rg-01"
  runner_labels       = ["${local.prefix}-${local.env}"]

  key_vault_name        = "${local.prefix}-${local.env_short}-kv-common"
  key_vault_rg          = "${local.prefix}-${local.env_short}-rg-common"
  key_vault_secret_name = "github-runner-pat"

  environment_name = "${local.prefix}-${local.env_short}-itn-github-runner-cae-01"
  environment_rg   = "${local.prefix}-${local.env_short}-itn-github-runner-rg-01"

  job = {
    name = "cgn"
  }
  job_meta = {
    repo = local.repo_name
  }

  container = {
    cpu    = 1
    memory = "2Gi"
    image  = "ghcr.io/pagopa/github-self-hosted-runner-azure:latest"
  }

  tags = local.tags
}
