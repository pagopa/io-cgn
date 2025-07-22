output "cgn_storage" {
  value = {
    id                  = azurerm_storage_account.cgn_storage.id
    name                = azurerm_storage_account.cgn_storage.name
    resource_group_name = azurerm_storage_account.cgn_storage.resource_group_name
    primary_web_host    = azurerm_storage_account.cgn_storage.primary_web_host
  }
}
