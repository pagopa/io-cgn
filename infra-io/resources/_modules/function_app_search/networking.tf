resource "azurerm_private_endpoint" "postgresql_db_pe_itn" {
  name                = "${var.project}-${var.domain}-psql-pep-${var.instance_number}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "${var.project}-${var.domain}-psql-pep-${var.instance_number}"
    private_connection_resource_id = "/subscriptions/74da48a3-b0e7-489d-8172-da79801086ed/resourceGroups/io-p-itn-cgn-pe-rg-01/providers/Microsoft.DBforPostgreSQL/flexibleServers/io-p-itn-cgn-pe-postgresql-psql-01"
    is_manual_connection           = false
    subresource_names              = ["postgresqlServer"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.postgres.id]
  }

  tags = var.tags
}