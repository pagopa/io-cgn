import {
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-itn-cgn-rg-01"
  to = azurerm_resource_group.cgn_itn_01
}

resource "azurerm_resource_group" "cgn_itn_01" {
  name     = "${local.project}-itn-${local.domain}-rg-01"
  location = local.location

  tags = local.tags
}
