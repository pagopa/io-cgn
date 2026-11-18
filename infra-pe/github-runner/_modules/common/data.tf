data "azurerm_log_analytics_workspace" "law_common" {
  name                = "cgnonboardingportal-${var.env_short}-law"
  resource_group_name = "cgnonboardingportal-${var.env_short}-monitor-rg"
}

data "azurerm_virtual_network" "vnet_pe" {
  name                = var.vnet.name
  resource_group_name = var.vnet.resource_group_name
}
