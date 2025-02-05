resource "azurerm_service_plan" "cgn_func_asp_01" {
  name                   = "${local.prefix}-${local.env_short}-${local.location_short}-${local.domain}-func-asp-01"
  location               = local.location
  resource_group_name    = azurerm_resource_group.itn_cgn.name
  os_type                = "Linux"
  sku_name               = "P1v3"
  zone_balancing_enabled = true
}

resource "azurerm_subnet" "cgn_common_subnet_01" {
  name                 = "${local.prefix}-${local.env_short}-${local.location_short}-${local.domain}-common-snet-01"
  virtual_network_name = data.azurerm_virtual_network.vnet_common_itn.name
  resource_group_name  = data.azurerm_virtual_network.vnet_common_itn.resource_group_name
  address_prefixes     = ["10.20.28.0/26"]

  service_endpoints = concat(
    ["Microsoft.CosmosDB"],
    ["Microsoft.Web"],
    ["Microsoft.Storage"],
  )

  delegation {
    name = "default"
    service_delegation {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

resource "azurerm_subnet" "cgn_func_search_subnet_01" {
  name                 = "${local.prefix}-${local.env_short}-${local.location_short}-${local.domain}-func-search-snet-01"
  virtual_network_name = data.azurerm_virtual_network.vnet_common_itn.name
  resource_group_name  = data.azurerm_virtual_network.vnet_common_itn.resource_group_name
  address_prefixes     = ["10.20.28.64/26"]

  service_endpoints = concat(
    ["Microsoft.CosmosDB"],
    ["Microsoft.Web"],
    ["Microsoft.Storage"],
  )

  delegation {
    name = "default"
    service_delegation {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}
