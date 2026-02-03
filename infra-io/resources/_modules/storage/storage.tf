resource "azurerm_storage_account" "cgn_storage" {
  name                            = "${replace(var.project, "-", "")}${replace(var.domain, "-", "")}st01"
  resource_group_name             = var.resource_group_name
  location                        = var.location
  account_tier                    = "Standard"
  account_kind                    = "StorageV2"
  account_replication_type        = "ZRS"
  https_traffic_only_enabled      = true
  allow_nested_items_to_be_public = true
  public_network_access_enabled   = true
  shared_access_key_enabled       = true
  min_tls_version                 = "TLS1_2"

  blob_properties {
    versioning_enabled = true
  }

  tags = var.tags
}

resource "azurerm_storage_table" "cardexpiration" {
  name                 = "cardexpiration"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}

resource "azurerm_storage_table" "eycacardexpiration" {
  name                 = "eycacardexpiration"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}

resource "azurerm_storage_queue" "activatedcgn" {
  name                 = "activatedcgn"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}

resource "azurerm_storage_queue" "activatedcgn-poison" {
  name                 = "activatedcgn-poison"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}

resource "azurerm_storage_queue" "activatedeyca" {
  name                 = "activatedeyca"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}

resource "azurerm_storage_queue" "activatedeyca-poison" {
  name                 = "activatedeyca-poison"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}

resource "azurerm_storage_queue" "expiredcgn" {
  name                 = "expiredcgn"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}

resource "azurerm_storage_queue" "expiredeyca" {
  name                 = "expiredeyca"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}

resource "azurerm_storage_queue" "messages" {
  name                 = "messages"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}

resource "azurerm_storage_queue" "messages-poison" {
  name                 = "messages-poison"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}

resource "azurerm_storage_queue" "pendingcgn" {
  name                 = "pendingcgn"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}

resource "azurerm_storage_queue" "pendingcgn-poison" {
  name                 = "pendingcgn-poison"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}

resource "azurerm_storage_queue" "pendingdeletecgn" {
  name                 = "pendingdeletecgn"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}

resource "azurerm_storage_queue" "pendingdeletecgn-poison" {
  name                 = "pendingdeletecgn-poison"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}

resource "azurerm_storage_queue" "pendingdeleteeyca" {
  name                 = "pendingdeleteeyca"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}

resource "azurerm_storage_queue" "pendingdeleteeyca-poison" {
  name                 = "pendingdeleteeyca-poison"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}

resource "azurerm_storage_queue" "pendingeyca" {
  name                 = "pendingeyca"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}

resource "azurerm_storage_queue" "pendingeyca-poison" {
  name                 = "pendingeyca-poison"
  storage_account_name = azurerm_storage_account.cgn_storage.name
}
