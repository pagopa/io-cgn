output "app_service_attribute_authority" {
  value = {
    id                   = module.app_service_attribute_authority.app_service.app_service.id
    name                 = module.app_service_attribute_authority.app_service.app_service.name
    resource_group_name  = module.app_service_attribute_authority.app_service.resource_group_name
    principal_id         = module.app_service_attribute_authority.app_service.app_service.principal_id
    staging_principal_id = module.app_service_attribute_authority.app_service.app_service.slot.principal_id
  }
}
