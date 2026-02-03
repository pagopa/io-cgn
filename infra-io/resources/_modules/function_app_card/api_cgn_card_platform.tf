resource "azurerm_api_management_api_version_set" "cgn_card_platform" {
  name                = "cgn_card_platform_v1"
  api_management_name = var.apim_platform_name
  resource_group_name = var.apim_platform_resource_group_name
  display_name        = "CGN Card Platform APIs"
  versioning_scheme   = "Segment"
}

resource "azurerm_api_management_api" "cgn_card_platform_v1" {
  name = format("%s-%s-cgn-card-api", var.prefix, var.env_short)

  api_management_name = var.apim_platform_name
  resource_group_name = var.apim_platform_resource_group_name

  subscription_required = false

  version_set_id = azurerm_api_management_api_version_set.cgn_card_platform.id
  version        = "v1"
  revision       = "1"

  description  = "These APIs support App IO about CGN Card"
  display_name = "CGN Card API"
  path         = "api/cgn-card"
  protocols    = ["https"]

  import {
    content_format = "openapi-link"
    content_value  = "https://raw.githubusercontent.com/pagopa/io-backend/980c38029102ea3c48a02104e29685082aee8f68/openapi/generated/api_cgn_card_platform.yaml"
  }
}

resource "azurerm_api_management_api_policy" "cgn_card_platform_v1" {
  api_name            = azurerm_api_management_api.cgn_card_platform_v1.name
  api_management_name = azurerm_api_management_api.cgn_card_platform_v1.api_management_name
  resource_group_name = azurerm_api_management_api.cgn_card_platform_v1.resource_group_name

  xml_content = file("${path.module}/policies/v1/_base_policy.xml")
}

resource "azurerm_api_management_product_api" "cgn_card_platform_v1" {
  api_name            = azurerm_api_management_api.cgn_card_platform_v1.name
  api_management_name = azurerm_api_management_api.cgn_card_platform_v1.api_management_name
  resource_group_name = azurerm_api_management_api.cgn_card_platform_v1.resource_group_name
  product_id          = var.apim_cgn_product_id
}

resource "azurerm_api_management_named_value" "app_backend_key" {
  name                = "io-app-backend-key"
  api_management_name = var.apim_platform_name
  resource_group_name = var.apim_platform_resource_group_name
  display_name        = "io-app-backend-key"
  value               = var.app_backend_api_key_secret
  secret              = true
}

resource "azurerm_api_management_api_tag" "io_cgn_card_api_tag" {
  api_id = azurerm_api_management_api.cgn_card_platform_v1.id
  name   = var.io_cgn_tag_name
}