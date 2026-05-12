# Private Endpoint for CosmosDB (io-p-cosmos-cgn) in PROD-IO subscription.
# This PE lives in the PE VNet and enables resources in PE subscription
# to reach CosmosDB privately (cross-subscription, similar to the psql PE pattern).
# Requires approval from the CosmosDB owner in the IO subscription.
resource "azurerm_private_endpoint" "cosmosdb_io" {
  name                = "${var.project}-${var.domain}-cosmos-cgn-pep-01"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "${var.project}-${var.domain}-cosmos-cgn-pep-01"
    private_connection_resource_id = var.cosmosdb_io_resource_id
    is_manual_connection           = true
    subresource_names              = ["Sql"]
    request_message                = "PE from CGN PE subscription for Data Factory"
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [var.private_dns_zone_cosmosdb_id]
  }

  tags = var.tags
}
