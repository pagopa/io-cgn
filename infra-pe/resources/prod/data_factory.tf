data "azuread_group" "bonus_admins" {
  display_name = "${local.prefix}-${local.env_short}-adgroup-bonus-admins"
}

# CosmosDB account in PROD-IO subscription
data "azurerm_cosmosdb_account" "io_cgn" {
  provider            = azurerm.io
  name                = "io-p-cosmos-cgn"
  resource_group_name = "io-p-rg-cgn"
}

module "data_factory" {
  source = "../_modules/data_factory"

  project             = local.project
  location            = local.location
  domain              = local.domain
  prefix              = local.prefix
  env_short           = local.env_short
  tags                = local.tags
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name
  subscription_id     = data.azurerm_subscription.current.subscription_id

  private_endpoint_subnet_id           = module.networking.pep_snet.id
  private_dns_zone_resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  private_dns_zone_datafactory_id = module.dns.private_dns_zones["datafactory"].id
  private_dns_zone_adf_portal_id  = module.dns.private_dns_zones["adf"].id
  private_dns_zone_cosmosdb_id    = module.dns.private_dns_zones["documents"].id

  # CosmosDB in PROD-IO subscription (io-p-cosmos-cgn in io-p-rg-cgn)
  cosmosdb_io_resource_id = data.azurerm_cosmosdb_account.io_cgn.id
}

# Grant team members Data Factory Contributor on the ADF
resource "azurerm_role_assignment" "adf_team_contributor" {
  scope                = module.data_factory.data_factory.id
  role_definition_name = "Data Factory Contributor"
  principal_id         = data.azuread_group.bonus_admins.object_id
}

# Grant ADF managed identity read access to CosmosDB (control plane)
# Required for ADF to list databases and containers when creating linked services
resource "azurerm_role_assignment" "adf_cosmosdb_reader" {
  provider             = azurerm.io
  scope                = data.azurerm_cosmosdb_account.io_cgn.id
  role_definition_name = "Cosmos DB Account Reader Role"
  principal_id         = module.data_factory.data_factory.principal_id
}

# Grant ADF managed identity data-plane access to CosmosDB SQL API
# This is the built-in "Cosmos DB Built-in Data Contributor" role
# Required for ADF pipelines to read/write CosmosDB data via managed identity auth
resource "azurerm_cosmosdb_sql_role_assignment" "adf_data_contributor" {
  provider            = azurerm.io
  resource_group_name = "io-p-rg-cgn"
  account_name        = data.azurerm_cosmosdb_account.io_cgn.name
  # Cosmos DB Built-in Data Contributor
  role_definition_id = "${data.azurerm_cosmosdb_account.io_cgn.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002"
  principal_id       = module.data_factory.data_factory.principal_id
  scope              = data.azurerm_cosmosdb_account.io_cgn.id
}
