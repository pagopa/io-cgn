output "container_app_environment" {
  value = {
    id                  = azurerm_container_app_environment.container_app_environment_runner.id
    name                = azurerm_container_app_environment.container_app_environment_runner.name
    resource_group_name = azurerm_container_app_environment.container_app_environment_runner.resource_group_name
  }
}

output "container_app_environment_02" {
  value = {
    id                  = module.container_app_environment_runner_02.id
    name                = module.container_app_environment_runner_02.name
    resource_group_name = module.container_app_environment_runner_02.resource_group_name
  }
}
