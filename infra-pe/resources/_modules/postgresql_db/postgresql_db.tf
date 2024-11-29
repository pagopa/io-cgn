module "postgresql_db" {
  source = "github.com/pagopa/dx//infra/modules/azure_postgres_server?ref=main"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "postgresql"
    instance_number = "01"
  }

  resource_group_name                  = var.resource_group_name
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name
  subnet_pep_id                        = var.private_endpoint_subnet_id

  administrator_credentials = {
    name     = var.db_username
    password = var.db_password
  }

  tier                  = var.tier
  db_version            = var.db_version
  storage_mb            = var.storage_mb
  backup_retention_days = var.backup_retention_days
  pgbouncer_enabled     = var.pgbouncer_enabled

  tags = var.tags
}
