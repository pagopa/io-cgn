module "pep_snet" {
  source               = "github.com/pagopa/terraform-azurerm-v4//subnet?ref=v1.1.0"
  name                 = "${var.project}-${var.domain}-pep-snet-01"
  address_prefixes     = var.pep_snet_cidr
  resource_group_name  = var.resource_group_name
  virtual_network_name = module.vnet_common.name

  private_endpoint_network_policies = "Disabled"
}
