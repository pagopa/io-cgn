terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "<= 3.116.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfinfprodesercenti"
    container_name       = "terraform-state"
    key                  = "io-pe-cgn.github-runner.prod.tfstate"
  }
}

provider "azurerm" {
  features {
  }
}

module "runner_commons" {
  source = "../_modules/common"

  prefix     = local.prefix
  env_short  = local.env_short
  env        = local.env
  repository = local.repo_name
  tags       = local.tags
}

module "container_app_job" {
  source = "github.com/pagopa/terraform-azurerm-v3.git//container_app_job_gh_runner_v2?ref=v8.50.0"

  location            = local.location.weu
  prefix              = local.prefix
  env_short           = local.env_short
  resource_group_name = module.runner_commons.resource_group_name
  runner_labels       = [local.env]

  key_vault_name        = "cgnonboardingportal-${local.env_short}-kv"
  key_vault_rg          = "cgnonboardingportal-${local.env_short}-sec-rg"
  key_vault_secret_name = "github-runner-pat"

  environment_name = module.container_app_environment_runner.name
  environment_rg   = module.container_app_environment_runner.resource_group_name

  job = {
    name = "infra"
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
