resource "azurerm_role_assignment" "bonus_owner_cgn_rg_itn_01" {
  scope                = data.azurerm_resource_group.itn_cgn.id
  role_definition_name = "Owner"
  principal_id         = data.azuread_group.bonus_admins.object_id
}

resource "azurerm_role_assignment" "bonus_kv_data_administrator_cgn_rg_itn_01" {
  scope                = data.azurerm_resource_group.itn_cgn.id
  role_definition_name = "Key Vault Data Access Administrator"
  principal_id         = data.azuread_group.bonus_admins.object_id
}

resource "azurerm_role_assignment" "bonus_kv_administrator_cgn_rg_itn_01" {
  scope                = data.azurerm_resource_group.itn_cgn.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = data.azuread_group.bonus_admins.object_id
}

module "appsvc_principal_role_assignments" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 1.3"

  for_each = toset([
    module.functions_cgn_card_02.function_app_cgn_card.principal_id,
    module.functions_cgn_card_02.function_app_cgn_card.staging_principal_id,
    module.functions_cgn_search_02.function_app_cgn_search.principal_id,
    module.functions_cgn_search_02.function_app_cgn_search.staging_principal_id
  ])

  principal_id    = each.value
  subscription_id = data.azurerm_client_config.current.subscription_id

  key_vault = [
    {
      name                = module.key_vaults.key_vault_cgn.name
      resource_group_name = module.key_vaults.key_vault_cgn.resource_group_name
      description         = "Allow function to read secrets from key vault"
      roles = {
        secrets = "reader"
      }
    }
  ]
}
