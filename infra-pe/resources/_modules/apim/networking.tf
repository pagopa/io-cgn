resource "azurerm_subnet" "cgn_pe_apim_subnet" {
  name                 = "${var.prefix}-${var.env_short}-${var.domain}-apim-snet-01"
  resource_group_name  = var.virtual_network.name
  virtual_network_name = var.virtual_network.resource_group_name
  address_prefixes     = [var.cidr_subnet_cgn_pe_apim]

  private_endpoint_network_policies = "Enabled"
delegation {
    name = "default"
    service_delegation {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
  service_endpoints = [
    "Microsoft.Web",
  ]
}
