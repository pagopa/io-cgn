terraform {

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfinfuatesercenti"
    container_name       = "terraform-state"
    key                  = "io-pe-cgn.resources.uat.tfstate"
  }

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "<= 3.116.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "itn_cgn_pe" {
  name     = "${local.project}-${local.domain}-rg-01"
  location = local.location
}

module "networking" {
  source = "../_modules/networking"

  project        = local.project
  location       = local.location
  location_short = local.location_short
  domain         = local.domain

  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  vnet_cidr_block         = "10.25.0.0/16"
  pep_snet_cidr           = ["10.25.2.0/23"]
  ddos_protection_enabled = false

  tags = local.tags
}

#-----------#
# DNS ZONES #
#-----------#

module "dns" {
  source = "../_modules/dns"

  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  virtual_network = {
    id   = module.networking.vnet_common.id
    name = module.networking.vnet_common.name
  }

  tags = local.tags
}
