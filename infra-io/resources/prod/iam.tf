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

