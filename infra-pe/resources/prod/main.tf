terraform {

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfinfprodesercenti"
    container_name       = "terraform-state"
    key                  = "io-pe-cgn.resources.prod.tfstate"
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

  vnet_cidr_block = "10.26.0.0/16"
  pep_snet_cidr   = ["10.26.2.0/23"]

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

# KEY VAULTS
module "key_vaults" {
  source = "../_modules/key_vaults"

  project             = local.project
  location            = local.location
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  tenant_id = data.azurerm_client_config.current.tenant_id

  tags = local.tags
}