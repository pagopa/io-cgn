output "function_app_cgn_support" {
  value = {
    id                   = module.function_app_cgn_support.function_app.function_app.id
    name                 = module.function_app_cgn_support.function_app.function_app.name
    resource_group_name  = module.function_app_cgn_support.function_app.resource_group_name
    principal_id         = module.function_app_cgn_support.function_app.function_app.principal_id
    staging_principal_id = module.function_app_cgn_support.function_app.function_app.slot.principal_id
  }
}
