

module "functions_cgn_support_01" {
  source = "../_modules/function_app_support"

  prefix          = local.prefix
  env_short       = local.env_short
  location        = local.location
  project         = local.project
  domain          = local.domain
  instance_number = "01"

  app_service_plan_id = resource.azurerm_service_plan.cgn_func_asp_01.id

  resource_group_name = azurerm_resource_group.itn_cgn.name

  subnet_id                            = resource.azurerm_subnet.cgn_common_subnet_01.id
  private_endpoint_subnet_id           = data.azurerm_subnet.pep.id
  private_dns_zone_resource_group_name = data.azurerm_resource_group.weu_common.name
  virtual_network = {
    resource_group_name = data.azurerm_virtual_network.vnet_common_itn.resource_group_name
    name                = data.azurerm_virtual_network.vnet_common_itn.name
  }

  ai_instrumentation_key = data.azurerm_application_insights.common.instrumentation_key
  ai_connection_string   = data.azurerm_application_insights.common.connection_string
  ai_sampling_percentage = 5

  cosmosdb_cgn_uri           = data.azurerm_key_vault_secret.cosmosdb_cgn_uri.value
  cosmosdb_cgn_key           = data.azurerm_key_vault_secret.cosmosdb_cgn_key.value
  cosmosdb_cgn_database_name = "db"

  storage_cgn_connection_string = data.azurerm_key_vault_secret.storage_cgn_connection_string.value

  table_cgn_expiration  = "cardexpiration"
  table_eyca_expiration = "eycacardexpiration"

  tags = local.tags
}