data "azurerm_subscription" "current" {}

data "azurerm_client_config" "current" {}

data "azuread_group" "bonus_admins" {
  display_name = "${local.prefix}-${local.env_short}-adgroup-bonus-admins"
}

data "azurerm_resource_group" "weu_common" {
  name = "${local.project_legacy}-rg-common"
}

data "azurerm_resource_group" "weu_operations" {
  name = "${local.project_legacy}-rg-operations"
}

data "azurerm_resource_group" "weu_sec" {
  name = "${local.project_legacy}-sec-rg"
}

data "azurerm_virtual_network" "vnet_common_itn" {
  name                = "${local.project}-common-vnet-01"
  resource_group_name = "${local.project}-common-rg-01"
}

data "azurerm_subnet" "pep" {
  name                 = "${local.project}-pep-snet-01"
  virtual_network_name = data.azurerm_virtual_network.vnet_common_itn.name
  resource_group_name  = data.azurerm_virtual_network.vnet_common_itn.resource_group_name
}

data "azurerm_nat_gateway" "itn_ng" {
  name                = "${local.project}-ng-01"
  resource_group_name = "${local.project}-common-rg-01"
}

data "azurerm_private_dns_zone" "privatelink_redis_cache" {
  name                = "privatelink.redis.cache.windows.net"
  resource_group_name = data.azurerm_resource_group.weu_common.name
}

data "azurerm_application_insights" "common" {
  name                = "${local.project_legacy}-ai-common"
  resource_group_name = data.azurerm_resource_group.weu_common.name
}

data "azurerm_cosmosdb_account" "cosmos_api" {
  name                = format("%s-cosmos-api", local.project_legacy)
  resource_group_name = format("%s-rg-internal", local.project_legacy)
}

data "azurerm_storage_account" "storage_api" {
  name                = replace("${local.project_legacy}stapi", "-", "")
  resource_group_name = format("%s-rg-internal", local.project_legacy)
}

data "azurerm_storage_account" "storage_cgn" {
  name                = replace("${local.project_legacy}stcgn", "-", "")
  resource_group_name = format("%s-rg-cgn", local.project_legacy)
}

data "azurerm_storage_account" "storage_cgn_itn" {
  name                = "iopitncgnst01"
  resource_group_name = "io-p-itn-cgn-rg-01"
}

data "azurerm_application_gateway" "io_app_gateway" {
  name                = "io-p-appgateway"
  resource_group_name = "io-p-rg-external"
}

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
