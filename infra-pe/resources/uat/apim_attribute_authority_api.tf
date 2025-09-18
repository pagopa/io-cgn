resource "azurerm_api_management_api_version_set" "attribute_authority_v1" {
  name                = "attribute_authority_v1"
  api_management_name = module.cgn_pe_apim.apim.name
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name
  display_name        = "Attribute Authority API"
  versioning_scheme   = "Segment"
}

resource "azurerm_api_management_api" "attribute_authority_api" {
  name = format("%s-%s-attribute-authority-api", local.prefix, local.env_short)

  api_management_name = module.cgn_pe_apim.apim.name
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  subscription_required = true

  version_set_id = azurerm_api_management_api_version_set.attribute_authority_v1.id
  version        = "v1"
  revision       = "1"

  description  = "Attribute Authority API"
  display_name = "Attribute Authority API"
  path         = "adeaa"
  protocols    = ["https"]

  import {
    content_format = "openapi-link"
    content_value  = "https://raw.githubusercontent.com/pagopa/io-cgn/2f8059ba6e2c0b4294c0544517d37bfb069db74a/apps/attribute-authority-ms/openapi/index.yaml"
  }
}

resource "azurerm_api_management_api_policy" "attribute_authority_api_policy" {
  api_name            = azurerm_api_management_api.attribute_authority_api.name
  api_management_name = module.cgn_pe_apim.apim.name
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  xml_content = file("apis/attribute_authority_api/v1/_base_policy.xml")
}

resource "azurerm_api_management_product_api" "attribute_authority_api_product" {
  api_name            = azurerm_api_management_api.attribute_authority_api.name
  api_management_name = module.cgn_pe_apim.apim.name
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name
  product_id          = azurerm_api_management_product.cgn_onboarding_portal_api_product.product_id
}
