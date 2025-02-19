resource "azurerm_cdn_profile" "this" {
  name                = "${var.project}-${var.domain}-cdnp-01"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = "Standard_Microsoft"

  tags = var.tags
}

resource "azurerm_cdn_endpoint" "cgn_pe_fe_endpoint" {
  name                = "${var.project}-${var.domain}-fe-cdne-01"
  resource_group_name = var.resource_group_name
  location            = azurerm_cdn_profile.this.location

  profile_name     = azurerm_cdn_profile.this.name
  is_https_allowed = true
  is_http_allowed  = true

  querystring_caching_behaviour = "BypassCaching"

  origin_host_header = azurerm_storage_account.cgn_pe_fe_storage.primary_blob_host

  origin {
    name      = "primary"
    host_name = azurerm_storage_account.cgn_pe_fe_storage.primary_blob_host
  }

  tags = var.tags
}

resource "azurerm_cdn_endpoint" "cgn_pe_fe_assets" {
  name                = "${var.project}-${var.domain}-assets-cdne-01"
  resource_group_name = var.resource_group_name
  location            = azurerm_cdn_profile.this.location

  profile_name     = azurerm_cdn_profile.this.name
  is_https_allowed = true
  is_http_allowed  = true

  querystring_caching_behaviour = "BypassCaching"

  origin_host_header = azurerm_storage_account.cgn_pe_assets_storage.primary_blob_host

  origin {
    name      = "primary"
    host_name = azurerm_storage_account.cgn_pe_assets_storage.primary_blob_host
  }

  tags = var.tags
}
