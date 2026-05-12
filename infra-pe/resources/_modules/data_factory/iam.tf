# Grant the ADF system-assigned managed identity blob write access to its storage account.
# "writer" maps to Storage Blob Data Contributor, allowing ADF pipelines to
# read, write, and delete blobs without connection strings.
module "adf_storage_role_assignment" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 2.0"

  principal_id    = azurerm_data_factory.this.identity[0].principal_id
  subscription_id = var.subscription_id

  storage_blob = [
    {
      storage_account_name = module.storage_adf.name
      resource_group_name  = var.resource_group_name
      role                 = "writer"
      description          = "Allow ADF managed identity to read and write blobs in its dedicated storage account"
    }
  ]
}
