resource "azurerm_api_management_api_version_set" "public_v1" {
  name                = "public_v1"
  api_management_name = module.cgn_pe_apim.apim.name
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name
  display_name        = "Public API"
  versioning_scheme   = "Segment"
}

resource "azurerm_api_management_api" "public_api" {
  name = format("%s-%s-public-api", local.prefix, local.env_short)

  api_management_name = module.cgn_pe_apim.apim.name
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  subscription_required = false

  version_set_id = azurerm_api_management_api_version_set.public_v1.id
  version        = "v1"
  revision       = "1"

  description  = "Public API"
  display_name = "Public API"
  path         = "public"
  protocols    = ["https"]

  import {
    content_format = "openapi-link"
    content_value  = "https://raw.githubusercontent.com/pagopa/cgn-onboarding-portal-backend/refs/tags/v2.1.5/openapi/public.yaml"
  }
}

resource "azurerm_api_management_api_policy" "public_api_policy" {
  api_name            = azurerm_api_management_api.public_api.name
  api_management_name = module.cgn_pe_apim.apim.name
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  xml_content = file("apis/backend_public_api/v1/_base_policy.xml")
}
