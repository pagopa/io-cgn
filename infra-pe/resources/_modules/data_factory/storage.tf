# ADF storage account — holds pipeline data, staging blobs, and intermediate artifacts.
# Named via the DX provider convention using local.storage_environment.
# Access is private-only; a blob private endpoint is created automatically.
module "storage_adf" {
  source  = "pagopa-dx/azure-storage-account/azurerm"
  version = "~> 2.0"

  environment = local.storage_environment
  tags        = var.tags

  resource_group_name = var.resource_group_name

  # Subnet used to create the blob private endpoint
  subnet_pep_id = var.private_endpoint_subnet_id

  # Resource group that holds the private DNS zones, so the module can
  # register the blob endpoint in privatelink.blob.core.windows.net
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name

  # Enable blob subservice only; add queue/table here if ADF pipelines need them
  subservices_enabled = {
    blob = true
  }

  containers = [
    {
      # Default container for ADF pipeline data (staging, exports, intermediate files)
      name        = "dfout"
      access_type = "private"
    }
  ]
}
