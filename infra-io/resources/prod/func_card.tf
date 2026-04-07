module "functions_cgn_card_02" {
  source = "../_modules/function_app_card"

  prefix          = local.prefix
  env_short       = local.env_short
  location        = local.location
  project         = local.project
  domain          = local.domain
  instance_number = "02"

  app_service_plan_id = resource.azurerm_service_plan.cgn_func_asp_01.id

  resource_group_name = data.azurerm_resource_group.itn_cgn.name

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

  redis_url      = module.redis_cgn_02.hostname
  redis_port     = module.redis_cgn_02.ssl_port
  redis_password = module.redis_cgn_02.primary_access_key

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

  eyca_api_base_url = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn.name};SecretName=EYCA-API-BASE-URL)"
  eyca_api_username = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn.name};SecretName=EYCA-API-USERNAME)"
  eyca_api_password = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn.name};SecretName=EYCA-API-PASSWORD)"

  services_api_url = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn.name};SecretName=SERVICES-API-URL)"
  services_api_key = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn.name};SecretName=SERVICES-API-KEY)"
  cgn_service_id   = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn.name};SecretName=CGN-SERVICE-ID)"

  cgn_legal_backup_storage_connection = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn.name};SecretName=CGN-LEGAL-BACKUP-STORAGE-CONNECTION)"
  cgn_legal_backup_container_name     = "cgn-legalbackup-blob"
  cgn_legal_backup_folder_name        = "cgn"

  otp_ttl_in_seconds   = "600"
  cgn_upper_bound_age  = "36"
  eyca_upper_bound_age = "31"

  apim_cgn_product_id               = azurerm_api_management_product.cgn_platform.product_id
  apim_platform_name                = data.azurerm_api_management.apim_platform.name
  apim_platform_resource_group_name = data.azurerm_api_management.apim_platform.resource_group_name

  io_cgn_tag_name = azurerm_api_management_tag.io_cgn_tag.name

  nat_gateway_id = data.azurerm_nat_gateway.itn_ng.id

  tags = local.tags
}
