terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "<= 3.116.0"
    }

    dx = {
      source = "pagopa-dx/azure"
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

provider "dx" {
  features {}
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

module "container_app_job_selfhosted_runner" {
  source  = "pagopa-dx/github-selfhosted-runner-on-container-app-jobs/azurerm"
  version = "~> 1.0"

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location.itn
    instance_number = "01"
  }

  resource_group_name = module.runner_commons.container_app_environment.resource_group_name

  repository = {
    name = local.repo_name
  }

  container_app_environment = {
    id       = module.runner_commons.container_app_environment.id
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

