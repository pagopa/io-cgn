output "container_app_environment" {
    value = {
        name = module.container_app_environment_runner.name
        resource_group_name = module.container_app_environment_runner.resource_group_name
    }
}