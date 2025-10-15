data "azurerm_key_vault" "cgn_pe_kv" {
  name                = var.key_vault_name
  resource_group_name = var.resource_group_name
}

data "azurerm_key_vault_certificate" "app_gw_platform" {
  name         = var.app_gw_cert_name
  key_vault_id = data.azurerm_key_vault.cgn_pe_kv.id
}
