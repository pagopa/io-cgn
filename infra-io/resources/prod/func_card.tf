data "azurerm_key_vault_secret" "cosmosdb_cgn_uri" {
  name         = "COSMOSDB-CGN-URI"
  key_vault_id = module.key_vaults.key_vault_cgn.id
}

data "azurerm_key_vault_secret" "cosmosdb_cgn_key" {
  name         = "COSMOSDB-CGN-KEY"
  key_vault_id = module.key_vaults.key_vault_cgn.id
}

data "azurerm_key_vault_secret" "storage_cgn_connection_string" {
  name         = "STORAGE-CGN-CONNECTION-STRING"
  key_vault_id = module.key_vaults.key_vault_cgn.id
}

data "azurerm_key_vault_secret" "eyca_api_base_url" {
  name         = "EYCA-API-BASE-URL"
  key_vault_id = module.key_vaults.key_vault_cgn.id
}

data "azurerm_key_vault_secret" "eyca_api_username" {
  name         = "EYCA-API-USERNAME"
  key_vault_id = module.key_vaults.key_vault_cgn.id
}

data "azurerm_key_vault_secret" "eyca_api_password" {
  name         = "EYCA-API-PASSWORD"
  key_vault_id = module.key_vaults.key_vault_cgn.id
}

data "azurerm_key_vault_secret" "services_api_url" {
  name         = "SERVICES-API-URL"
  key_vault_id = module.key_vaults.key_vault_cgn.id
}

data "azurerm_key_vault_secret" "services_api_key" {
  name         = "SERVICES-API-KEY"
  key_vault_id = module.key_vaults.key_vault_cgn.id
}

data "azurerm_key_vault_secret" "cgn_service_id" {
  name         = "CGN-SERVICE-ID"
  key_vault_id = module.key_vaults.key_vault_cgn.id
}

data "azurerm_key_vault_secret" "cgn_legal_backup_storage_connection" {
  name         = "CGN-LEGAL-BACKUP-STORAGE-CONNECTION"
  key_vault_id = module.key_vaults.key_vault_cgn.id
}

module "functions_cgn_card_02" {
  source = "../_modules/function_app_card"

  prefix          = local.prefix
  env_short       = local.env_short
  location        = local.location
  project         = local.project
  domain          = local.domain
  instance_number = "02"

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

  redis_url      = module.redis_cgn.hostname
  redis_port     = module.redis_cgn.ssl_port
  redis_password = module.redis_cgn.primary_access_key

  cosmosdb_cgn_uri           = data.azurerm_key_vault_secret.cosmosdb_cgn_uri.value
  cosmosdb_cgn_key           = data.azurerm_key_vault_secret.cosmosdb_cgn_key.value
  cosmosdb_cgn_database_name = "db"

  storage_cgn_connection_string = data.azurerm_key_vault_secret.storage_cgn_connection_string.value

  table_cgn_expiration  = "cardexpiration"
  table_eyca_expiration = "eycacardexpiration"

  pending_cgn_queue_name         = "pendingcgn"
  pending_eyca_queue_name        = "pendingeyca"
  activated_cgn_queue_name       = "activatedcgn"
  activated_eyca_queue_name      = "activatedeyca"
  pending_delete_cgn_queue_name  = "pendingdeletecgn"
  pending_delete_eyca_queue_name = "pendingdeleteeyca"
  expired_cgn_queue_name         = "expiredcgn"
  expired_eyca_queue_name        = "expiredeyca"
  messages_queue_name            = "messages"

  eyca_api_base_url = data.azurerm_key_vault_secret.eyca_api_base_url.value
  eyca_api_username = data.azurerm_key_vault_secret.eyca_api_username.value
  eyca_api_password = data.azurerm_key_vault_secret.eyca_api_password.value

  services_api_url = data.azurerm_key_vault_secret.services_api_url.value
  services_api_key = data.azurerm_key_vault_secret.services_api_key.value
  cgn_service_id   = data.azurerm_key_vault_secret.cgn_service_id.value

  cgn_legal_backup_storage_connection = data.azurerm_key_vault_secret.cgn_legal_backup_storage_connection.value
  cgn_legal_backup_container_name     = "cgn-legalbackup-blob"
  cgn_legal_backup_folder_name        = "cgn"

  otp_ttl_in_seconds   = "600"
  cgn_upper_bound_age  = "36"
  eyca_upper_bound_age = "31"

  nat_gateway_id = data.azurerm_nat_gateway.itn_ng.id

  tags = local.tags
}