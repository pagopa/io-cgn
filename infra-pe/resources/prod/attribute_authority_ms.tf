data "azurerm_key_vault_secret" "attribute_authority_postgresql_connection_string" {
  name         = "attribute-authority-postgresql-connection-string"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

module "app_service_attribute_authority" {
  source = "../_modules/app_service_attribute_authority"

  prefix    = local.prefix
  env_short = local.env_short
  location  = local.location
  project   = local.project
  domain    = local.domain

  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  attribute_authority_tier = "m"

  ai_instrumentation_key = data.azurerm_application_insights.ai_cgn_pe.instrumentation_key
  ai_connection_string   = data.azurerm_application_insights.ai_cgn_pe.connection_string
  ai_sampling_percentage = 100

  cidr_subnet_cgn_attribute_authority  = "10.26.0.0/26"
  private_endpoint_subnet_id           = module.networking.pep_snet.id
  private_dns_zone_resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  virtual_network = {
    resource_group_name = module.networking.vnet_common.resource_group_name
    name                = module.networking.vnet_common.name
  }

  attribute_authority_postgres_db_admin_connection_string = ""

  tags = local.tags
}
