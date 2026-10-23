resource "azurerm_logic_app_workflow" "smart_agent_export" {
  name                = "${local.project}-${local.domain}-smart-agent-export-la-01"
  location            = local.location
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  identity {
    type = "SystemAssigned"
  }

  tags = local.tags

  lifecycle {
    # The Key Vault connection ($connections) is set via the designer, not in Terraform
    ignore_changes = [parameters, workflow_parameters]
  }
}

resource "azurerm_monitor_metric_alert" "smart_agent_export_runs_failed" {
  name                = "[CGN | PE] Smart agent export logic app run failed"
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name
  scopes              = [azurerm_logic_app_workflow.smart_agent_export.id]
  description         = "At least one run of the smart-agent-export logic app failed."
  severity            = 1
  frequency           = "PT1H"
  window_size         = "PT6H"

  criteria {
    metric_namespace = "Microsoft.Logic/workflows"
    metric_name      = "RunsFailed"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 0
  }

  action {
    action_group_id = data.azurerm_monitor_action_group.ag_cgn_pe.id
  }

  tags = local.tags
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
