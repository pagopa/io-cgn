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
  env_short      = local.env_short

  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  vnet_cidr_block         = "10.25.0.0/16"
  pep_snet_cidr           = ["10.25.2.0/23"]
  ddos_protection_enabled = false

  tags = local.tags
}

module "vpn" {
  source = "../_modules/vpn"

  location            = local.location
  location_short      = local.location_short
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name
  project             = local.project
  prefix              = local.prefix
  env_short           = local.env_short

  subscription_current     = data.azurerm_subscription.current
  virtual_network          = module.networking.vnet_common
  vpn_cidr_subnet          = ["10.25.133.0/24"]
  dnsforwarder_cidr_subnet = ["10.25.252.8/29"]

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

module "dns_weu" {
  source = "../_modules/dns"

  resource_group_name = data.azurerm_virtual_network.weu.resource_group_name

  virtual_network = {
    id   = data.azurerm_virtual_network.weu.id
    name = data.azurerm_virtual_network.weu.name
  }

  override_link_names = {
    azure_api_net = data.azurerm_virtual_network.weu.resource_group_name
    psql = "cgnonboardingportal-${local.env_short}-private-dns-zone-link"
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