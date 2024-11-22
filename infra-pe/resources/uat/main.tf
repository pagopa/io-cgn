terraform {

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfappprodio"
    container_name       = "terraform-state"
    key                  = "io-cgn-uat.resources.tfstate"
  }

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "<= 3.106.1"
    }
  }
}

provider "azurerm" {
  features {}
}

provider "azurerm" {
  features {}
  alias           = "uatesercenti"
  subscription_id = "d1a90d9f-6ee1-4fb2-a149-7aedbf3ed49d"
}

resource "azurerm_resource_group" "itn_cgn_pe" {
  provider = azurerm.uatesercenti
  name     = "${local.project}-${local.domain}-pe-rg-01"
  location = local.location
}

module "networking" {
  source    = "../_modules/networking"
  providers = { azurerm = azurerm.uatesercenti }

  project        = local.project
  location       = local.location
  location_short = local.location_short
  domain         = local.domain

  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  vnet_cidr_block = "10.30.0.0/16"
  pep_snet_cidr   = ["10.30.2.0/23"]

  tags = local.tags
}
