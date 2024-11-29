data "azurerm_subscription" "current" {}

data "azurerm_client_config" "current" {}

data "azurerm_resource_group" "weu_pe_monitor_rg" {
  name = "cgnonboardingportal-${local.env_short}-monitor-rg"
}

data "azurerm_application_insights" "ai_cgn_pe" {
  name                = "cgnonboardingportal-${local.env_short}-app-insights"
  resource_group_name = data.azurerm_resource_group.weu_pe_monitor_rg.name
}