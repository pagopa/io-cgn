output "key_vault_cgn_pe" {
  value = {
    id                  = azurerm_key_vault.cgn_pe.id
    name                = azurerm_key_vault.cgn_pe.name
    resource_group_name = azurerm_key_vault.cgn_pe.resource_group_name
  }
}