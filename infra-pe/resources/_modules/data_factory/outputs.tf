output "data_factory" {
  value = {
    id           = azurerm_data_factory.this.id
    name         = azurerm_data_factory.this.name
    principal_id = azurerm_data_factory.this.identity[0].principal_id
  }
}

output "storage_adf" {
  description = "ADF storage account details."
  value = {
    id                    = module.storage_adf.id
    name                  = module.storage_adf.name
    resource_group_name   = module.storage_adf.resource_group_name
    primary_blob_endpoint = module.storage_adf.primary_blob_endpoint
  }
}
