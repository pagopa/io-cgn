output "key_vault_cgn" {
  value = {
    id                  = azurerm_key_vault.cgn-pe.id
    name                = azurerm_key_vault.cgn-pe.name
    resource_group_name = azurerm_key_vault.cgn-pe.resource_group_name
  }
}