module "functions_cgn_merchant_02" {
  source = "../_modules/function_app_merchant"

  prefix          = local.prefix
  env_short       = local.env_short
  location        = local.location
  project         = local.project
  domain          = local.domain
  instance_number = "02"

  app_service_plan_id = resource.azurerm_service_plan.cgn_func_asp_01.id

  resource_group_name = data.azurerm_resource_group.itn_cgn.name

  ai_instrumentation_key = data.azurerm_application_insights.common.instrumentation_key
  ai_connection_string   = data.azurerm_application_insights.common.connection_string
  ai_sampling_percentage = 5

  subnet_id                            = resource.azurerm_subnet.cgn_common_subnet_01.id
  private_endpoint_subnet_id           = data.azurerm_subnet.pep.id
  private_dns_zone_resource_group_name = data.azurerm_resource_group.weu_common.name
  virtual_network = {
    resource_group_name = data.azurerm_virtual_network.vnet_common_itn.resource_group_name
    name                = data.azurerm_virtual_network.vnet_common_itn.name
  }

  redis_url      = module.redis_cgn.hostname
  redis_port     = module.redis_cgn.ssl_port
  redis_password = module.redis_cgn.primary_access_key

  tags = local.tags
}
