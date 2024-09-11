terraform {

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfappprodio"
    container_name       = "terraform-state"
    key                  = "io-cgn.resources.tfstate"
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

resource "azurerm_resource_group" "itn_cgn" {
  name     = "${local.project}-${local.domain}-rg-01"
  location = local.location
}

module "redis_cgn" {
  source = "github.com/pagopa/terraform-azurerm-v3//redis_cache?ref=v8.21.0"

  name                = "${local.project}-${local.domain}-redis-01"
  resource_group_name = azurerm_resource_group.itn_cgn.name
  location            = azurerm_resource_group.itn_cgn.location

  capacity              = 1
  family                = "P"
  sku_name              = "Premium"
  redis_version         = "6"
  enable_authentication = true
  zones                 = [1, 2]

  // when azure can apply patch?
  patch_schedules = [{
    day_of_week    = "Sunday"
    start_hour_utc = 23
    },
    {
      day_of_week    = "Monday"
      start_hour_utc = 23
    },
    {
      day_of_week    = "Tuesday"
      start_hour_utc = 23
    },
    {
      day_of_week    = "Wednesday"
      start_hour_utc = 23
    },
    {
      day_of_week    = "Thursday"
      start_hour_utc = 23
    },
  ]

  private_endpoint = {
    enabled              = true
    subnet_id            = data.azurerm_subnet.pep.id
    virtual_network_id   = data.azurerm_virtual_network.vnet_common_itn.id
    private_dns_zone_ids = [data.azurerm_private_dns_zone.privatelink_redis_cache.id]
  }

  tags = local.tags
}


