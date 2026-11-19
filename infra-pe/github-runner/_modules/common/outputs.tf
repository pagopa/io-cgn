output "container_app_environment_02" {
  value = {
    id                  = azurerm_container_app_environment.container_app_environment_runner_02.id
    name                = azurerm_container_app_environment.container_app_environment_runner_02.name
    resource_group_name = azurerm_container_app_environment.container_app_environment_runner_02.resource_group_name
  }
}
