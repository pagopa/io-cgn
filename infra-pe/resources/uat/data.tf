data "azurerm_subscription" "current" {}

data "azurerm_client_config" "current" {}

data "azurerm_resource_group" "weu_pe_monitor_rg" {
  name = "cgnonboardingportal-${local.env_short}-monitor-rg"
}

data "azurerm_application_insights" "ai_cgn_pe" {
  name                = "cgnonboardingportal-${local.env_short}-app-insights"
  resource_group_name = data.azurerm_resource_group.weu_pe_monitor_rg.name
}

data "azurerm_virtual_network" "weu" {
  name                = "cgnonboardingportal-${local.env_short}-vnet"
  resource_group_name = "cgnonboardingportal-${local.env_short}-vnet-rg"
}

data "azurerm_monitor_action_group" "ag_cgn_pe" {
  name                = "cgn${local.env_short}error"
  resource_group_name = data.azurerm_resource_group.weu_pe_monitor_rg.name
}
