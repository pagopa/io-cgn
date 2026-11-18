terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.81"
    }

    dx = {
      source  = "pagopa-dx/azure"
      version = "0.12.10"
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

provider "dx" {}

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
    cidr = "10.26.200.0/23"
  }
}

module "container_app_job_selfhosted_runner_02" {
  source  = "pagopa-dx/github-selfhosted-runner-on-container-app-jobs/azurerm"
  version = "4.0.1"

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location.itn
    instance_number = "02"
  }

  resource_group_name = module.runner_commons.container_app_environment_02.resource_group_name

  repository = {
    name = local.repo_name
  }

  container_app_environment = {
    id       = module.runner_commons.container_app_environment_02.id
    location = local.location.itn

    cpu                        = 2
    memory                     = "4Gi"
    replica_timeout_in_seconds = 7200
    use_labels                 = true
    override_labels            = [local.env]
  }

  key_vault = {
    name                = "${local.project}-itn-${local.domain}-kv-01"
    resource_group_name = "${local.project}-itn-${local.domain}-rg-01"
    use_rbac            = true
  }

  tags = local.tags
}
