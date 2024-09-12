output "key_vault_cgn" {
  value = {
    id                  = azurerm_key_vault.cgn.id
    name                = azurerm_key_vault.cgn.name
    resource_group_name = azurerm_key_vault.cgn.resource_group_name
  }
}