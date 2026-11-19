resource "azurerm_resource_group" "rg_github_runner" {
  name     = "${local.project}-github-runner-rg"
  location = local.location.itn

  tags = var.tags
}


resource "azurerm_container_app_environment" "container_app_environment_runner_02" {
  name                = provider::dx::resource_name(merge(local.cae_environment, { resource_type = "container_app_environment" }))
  location            = local.location.itn
  resource_group_name = azurerm_resource_group.rg_github_runner.name

  identity {
    type = "SystemAssigned"
  }

  infrastructure_subnet_id       = azurerm_subnet.subnet_runner_02.id
  internal_load_balancer_enabled = false
  public_network_access          = "Disabled"
  logs_destination               = "azure-monitor"
  zone_redundancy_enabled        = local.cae_use_case.zone_redundancy_enabled

  workload_profile {
    name                  = "Consumption"
    workload_profile_type = "Consumption"
  }

  lifecycle {
    ignore_changes = [
      infrastructure_resource_group_name, # Provider forces recreation at every plan otherwise
    ]
  }

  timeouts {
    create = "60m"
  }

  tags = var.tags
}

resource "azurerm_monitor_diagnostic_setting" "cae_runner_02" {
  name                       = "${azurerm_container_app_environment.container_app_environment_runner_02.name}-diagnostics"
  target_resource_id         = azurerm_container_app_environment.container_app_environment_runner_02.id
  log_analytics_workspace_id = data.azurerm_log_analytics_workspace.law_common.id

  enabled_log {
    category_group = "allLogs"
  }

  enabled_metric {
    category = "AllMetrics"
  }
}

resource "azurerm_management_lock" "lock_cae_runner_02" {
  count = local.cae_use_case.lock_enabled ? 1 : 0

  lock_level = "CanNotDelete"
  name       = azurerm_container_app_environment.container_app_environment_runner_02.name
  notes      = "This Container App Environment cannot be deleted"
  scope      = azurerm_container_app_environment.container_app_environment_runner_02.id

  depends_on = [azurerm_monitor_diagnostic_setting.cae_runner_02]
}
