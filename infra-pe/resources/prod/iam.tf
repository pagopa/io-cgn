module "appsvc_principal_role_assignments" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 1.3"

  for_each = toset([
    module.app_service_onboarding_portal_backend.app_service_onboarding_portal_backend.principal_id,
    module.app_service_onboarding_portal_backend.app_service_onboarding_portal_backend.staging_principal_id,
  ])

  principal_id    = each.value
  subscription_id = data.azurerm_client_config.current.subscription_id

  key_vault = [
    {
      name                = module.key_vaults.key_vault_cgn_pe.name
      resource_group_name = module.key_vaults.key_vault_cgn_pe.resource_group_name
      description         = "Allow function to read secrets from key vault"
      roles = {
        secrets = "reader"
      }
    }
  ]
}
