resource "azurerm_private_endpoint" "postgresql_db_pe_itn" {
  name                = "${var.project}-${var.domain}-psql-pep-01"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "${var.project}-${var.domain}-psql-pep-01"
    private_connection_resource_id = var.postgresql_db_pe_itn_prod_resource_id
    is_manual_connection           = false
    subresource_names              = ["postgresqlServer"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.postgres.id]
  }

  tags = var.tags
}