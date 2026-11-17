resource "azurerm_resource_group" "rg_github_runner" {
  name     = "${local.project}-github-runner-rg"
  location = local.location.itn

  tags = var.tags
}


resource "azurerm_container_app_environment" "container_app_environment_runner" {
  resource_group_name = azurerm_resource_group.rg_github_runner.name
  location            = local.location.itn
  name                = "${local.project}-github-runner-cae"

  infrastructure_subnet_id       = azurerm_subnet.subnet_runner.id
  internal_load_balancer_enabled = true
  zone_redundancy_enabled        = false

  log_analytics_workspace_id = data.azurerm_log_analytics_workspace.law_common.id

  tags = var.tags
}

moved {
  from = module.container_app_environment_runner.azurerm_container_app_environment.container_app_environment
  to   = azurerm_container_app_environment.container_app_environment_runner
}

resource "azurerm_management_lock" "lock_cae" {
  lock_level = "CanNotDelete"
  name       = "${local.project}-github-runner-cae"
  notes      = "This Container App Environment cannot be deleted"
  scope      = azurerm_container_app_environment.container_app_environment_runner.id
}
