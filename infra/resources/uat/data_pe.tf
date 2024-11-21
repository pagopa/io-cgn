data "azurerm_resource_group" "weu_pe_monitor_rg" {
  provider = azurerm.uatesercenti
  name     = "cgnonboardingportal-u-monitor-rg"
}

data "azurerm_application_insights" "ai_cgn_pe" {
  provider            = azurerm.uatesercenti
  name                = "cgnonboardingportal-u-app-insights"
  resource_group_name = data.azurerm_resource_group.weu_pe_monitor_rg.name
}
