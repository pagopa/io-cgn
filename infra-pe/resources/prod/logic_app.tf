resource "azurerm_logic_app_workflow" "smart_agent_export" {
  name                = "${local.project}-${local.domain}-smart-agent-export-la-01"
  location            = local.location
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  identity {
    type = "SystemAssigned"
  }

  tags = local.tags
}

resource "azurerm_logic_app_trigger_recurrence" "smart_agent_export_schedule" {
  name         = "schedule"
  logic_app_id = azurerm_logic_app_workflow.smart_agent_export.id
  frequency    = "Day"
  interval     = 1
  time_zone    = "W. Europe Standard Time"
  schedule {
    at_these_hours   = [5]
    at_these_minutes = [0]
  }
}

module "smart_agent_export_kv_role_assignment" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 1.3"

  principal_id    = azurerm_logic_app_workflow.smart_agent_export.identity[0].principal_id
  subscription_id = data.azurerm_client_config.current.subscription_id

  key_vault = [
    {
      name                = module.key_vaults.key_vault_cgn_pe.name
      resource_group_name = module.key_vaults.key_vault_cgn_pe.resource_group_name
      description         = "Allow smart-agent-export logic app to read logic-app-long-lived-jwt secret"
      roles = {
        secrets = "reader"
      }
    }
  ]
}
