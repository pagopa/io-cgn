terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "<= 3.116.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfinfuatesercenti"
    container_name       = "terraform-state"
    key                  = "io-pe-cgn.github-runner.uat.tfstate"
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
  domain     = local.domain
  repository = local.repo_name
  tags       = local.tags

  vnet = {
    name                = "${local.project}-itn-${local.domain}-vnet-01"
    resource_group_name = "${local.project}-itn-${local.domain}-rg-01"
  }

  snet = {
    cidr = "10.25.200.0/23"
  }
}

module "container_app_job" {
  source = "github.com/pagopa/terraform-azurerm-v3.git//container_app_job_gh_runner_v2?ref=v8.60.0"

  location            = local.location.weu
  prefix              = local.prefix
  env_short           = local.env_short
  resource_group_name = module.runner_commons.container_app_environment.resource_group_name
  runner_labels       = [local.env]

  key_vault_name        = "${local.project}-${local.domain}-kv-01"
  key_vault_rg          = "${local.project}-${local.domain}-rg-01"
  key_vault_secret_name = "github-runner-pat"

  environment_name = module.runner_commons.container_app_environment.name
  environment_rg   = module.runner_commons.container_app_environment.resource_group_name

  replica_timeout_in_seconds = 7200

  job = {
    name = "infra"
  }
  job_meta = {
    repo = local.repo_name
  }

  container = {
    cpu    = 2
    memory = "4Gi"
    image  = "ghcr.io/pagopa/github-self-hosted-runner-azure:latest"
  }

  tags = local.tags
}
