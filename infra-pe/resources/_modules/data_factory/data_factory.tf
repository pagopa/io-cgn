resource "azurerm_data_factory" "this" {
  name                = "${var.project}-${var.domain}-adf-01"
  location            = var.location
  resource_group_name = var.resource_group_name

  # Disables public access; ADF Studio and APIs are reachable only via private endpoints
  public_network_enabled = false

  # Enables ADF Managed Virtual Network so the Azure Integration Runtime
  # can connect to resources through managed private endpoints
  managed_virtual_network_enabled = true

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

# Integration Runtime running inside ADF Managed VNet.
# Required for ADF pipelines to connect to resources via managed private endpoints.
resource "azurerm_data_factory_integration_runtime_azure" "managed_vnet" {
  name            = "ManagedVNetIR"
  data_factory_id = azurerm_data_factory.this.id
  location        = var.location

  virtual_network_enabled = true
}

# Managed Private Endpoint from ADF to CosmosDB in PROD-IO subscription.
# Enables ADF pipelines (via ManagedVNetIR) to reach CosmosDB privately.
# Requires approval from the CosmosDB owner in the IO subscription.
resource "azurerm_data_factory_managed_private_endpoint" "cosmosdb_io" {
  name               = "cosmosdb-io-cgn"
  data_factory_id    = azurerm_data_factory.this.id
  target_resource_id = var.cosmosdb_io_resource_id
  subresource_name   = "Sql"
}

# Private Endpoint for ADF data plane (pipeline authoring, monitoring).
# Allows access to ADF APIs from PE VNet (e.g. via VPN).
resource "azurerm_private_endpoint" "adf" {
  name                = "${var.project}-${var.domain}-adf-pep-01"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "${var.project}-${var.domain}-adf-pep-01"
    private_connection_resource_id = azurerm_data_factory.this.id
    is_manual_connection           = false
    subresource_names              = ["dataFactory"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [var.private_dns_zone_datafactory_id]
  }

  tags = var.tags
}

# Private Endpoint for ADF Studio web UI.
# Allows access to ADF Studio from PE VNet (e.g. via VPN).
resource "azurerm_private_endpoint" "adf_portal" {
  name                = "${var.project}-${var.domain}-adf-portal-pep-01"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "${var.project}-${var.domain}-adf-portal-pep-01"
    private_connection_resource_id = azurerm_data_factory.this.id
    is_manual_connection           = false
    subresource_names              = ["portal"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [var.private_dns_zone_adf_portal_id]
  }

  tags = var.tags
}
