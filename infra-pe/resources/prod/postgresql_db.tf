data "azurerm_key_vault_secret" "db_administrator_login" {
  name         = "db-administrator-login"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "db_administrator_login_password" {
  name         = "db-administrator-login-password"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

module "postgresql_db" {
  source = "../_modules/postgresql_db"

  prefix    = local.prefix
  env_short = local.env_short
  location  = local.location
  project   = local.project
  domain    = local.domain

  resource_group_name                  = azurerm_resource_group.itn_cgn_pe.name
  private_endpoint_subnet_id           = module.networking.pep_snet.id
  private_dns_zone_resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  db_username = data.azurerm_key_vault_secret.db_administrator_login.value
  db_password = data.azurerm_key_vault_secret.db_administrator_login_password.value

  tier                  = "l"
  db_version            = 16
  storage_mb            = 262144
  backup_retention_days = 14
  pgbouncer_enabled     = true

  tags = local.tags
}
