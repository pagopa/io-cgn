module "vnet_common" {
  source = "github.com/pagopa/terraform-azurerm-v3//virtual_network?ref=v8.27.0"

  name                = "${var.project}-${var.domain}-pe-vnet-01"
  location            = var.location
  resource_group_name = var.resource_group_name

  address_space        = [var.vnet_cidr_block]
  ddos_protection_plan = local.ddos_protection_plan

  tags = var.tags
}
