module "vnet_common" {
  source = "github.com/pagopa/terraform-azurerm-v4//virtual_network?ref=v1.1.0"

  name                = "${var.project}-${var.domain}-vnet-01"
  location            = var.location
  resource_group_name = var.resource_group_name

  address_space        = [var.vnet_cidr_block]
  ddos_protection_plan = var.ddos_protection_enabled ? local.ddos_protection_plan : null

  tags = var.tags
}

resource "azurerm_virtual_network_peering" "itn_weu" {
  name                      = format("%s-to-%s", module.vnet_common.name, data.azurerm_virtual_network.weu.name)
  resource_group_name       = var.resource_group_name
  virtual_network_name      = module.vnet_common.name
  remote_virtual_network_id = data.azurerm_virtual_network.weu.id

  allow_gateway_transit        = false
  use_remote_gateways          = false
}
