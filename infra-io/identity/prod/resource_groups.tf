resource "azurerm_resource_group" "cgn_itn_01" {
  name     = "${local.project}-itn-${local.domain}-rg-01"
  location = local.location

  tags = local.tags
}
