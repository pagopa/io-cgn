module "vnet_common" {
  source = "github.com/pagopa/terraform-azurerm-v4//virtual_network?ref=v1.1.0"

  name                = "${var.project}-${var.domain}-vnet-01"
  location            = var.location
  resource_group_name = var.resource_group_name

  address_space        = [var.vnet_cidr_block]
  ddos_protection_plan = var.ddos_protection_enabled ? local.ddos_protection_plan : null

  tags = var.tags
}
