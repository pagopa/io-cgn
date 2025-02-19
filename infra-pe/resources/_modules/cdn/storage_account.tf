resource "azurerm_storage_account" "cgn_pe_fe_storage" {
  name                            = "${replace(var.project, "-", "")}${replace(var.domain, "-", "")}fest01"
  resource_group_name             = var.resource_group_name
  location                        = var.location
  account_tier                    = "Standard"
  account_kind                    = "StorageV2"
  account_replication_type        = "ZRS"
  https_traffic_only_enabled      = true
  allow_nested_items_to_be_public = true
  public_network_access_enabled   = true
  shared_access_key_enabled       = false
  min_tls_version                 = "TLS1_2"

  blob_properties {
    versioning_enabled = true
  }

  tags = var.tags
}

resource "azurerm_storage_account" "cgn_pe_assets_storage" {
  name                            = "${replace(var.project, "-", "")}${replace(var.domain, "-", "")}assetsst01"
  resource_group_name             = var.resource_group_name
  location                        = var.location
  account_tier                    = "Standard"
  account_kind                    = "StorageV2"
  account_replication_type        = "ZRS"
  https_traffic_only_enabled      = true
  allow_nested_items_to_be_public = true
  public_network_access_enabled   = true
  shared_access_key_enabled       = false
  min_tls_version                 = "TLS1_2"

  blob_properties {
    versioning_enabled = true
  }

  tags = var.tags
}

resource "azurerm_storage_account_static_website" "cgn_pe_fe_website" {
  storage_account_id = azurerm_storage_account.cgn_pe_fe_storage.id
  index_document     = "index.html"
}

resource "azurerm_storage_container" "cgn_pe_fe_profile_images" {
  name                 = "profileimages"
  storage_account_id = azurerm_storage_account.cgn_pe_assets_storage.id

  # tfsec:ignore:azure-storage-no-public-access
  container_access_type = "container"
}