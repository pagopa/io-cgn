data "azurerm_key_vault_certificate" "app_gw_platform" {
    # "api-cgnonboardingportal-uat-pagopa-it"
  name         = var.app_gw_cert_name
  key_vault_id = module.key_vault.id
}
