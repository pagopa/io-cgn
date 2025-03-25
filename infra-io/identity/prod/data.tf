data "azurerm_subscription" "cgn" {
  provider = azurerm.peprod
}

data "azurerm_subscription" "current" {}
