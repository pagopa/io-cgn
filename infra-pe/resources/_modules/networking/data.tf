data "azurerm_virtual_network" "weu" {
  name                = "cgnonboardingportal-${var.env_short}-vnet"
  resource_group_name = "cgnonboardingportal-${var.env_short}-vnet-rg"
}