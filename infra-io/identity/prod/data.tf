data "azurerm_subscription" "cgn" {
  provider = azurerm.peprod
}

data "azurerm_subscription" "current" {}

data "azurerm_log_analytics_workspace" "common" {
  name                = "io-p-law-common"
  resource_group_name = "io-p-rg-common"
}
