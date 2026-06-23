resource "azurerm_api_management_api_version_set" "admin_v1" {
  name                = "admin_v1"
  api_management_name = module.cgn_pe_apim.apim.name
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name
  display_name        = "Admin API"
  versioning_scheme   = "Segment"
}

resource "azurerm_api_management_api" "admin_api" {
  name = format("%s-%s-admin-api", local.prefix, local.env_short)

  api_management_name = module.cgn_pe_apim.apim.name
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  subscription_required = false

  version_set_id = azurerm_api_management_api_version_set.admin_v1.id
  version        = "v1"
  revision       = "1"

  description  = "Admin API"
  display_name = "Admin API"
  path         = "backoffice"
  protocols    = ["https"]

  import {
    content_format = "openapi-link"
    content_value  = "https://raw.githubusercontent.com/pagopa/cgn-onboarding-portal-backend/8aac44523db4fa342b17d015fb78ba32c4abb6e5/openapi/backoffice/openapi.yaml"
  }
}

resource "azurerm_api_management_api_policy" "admin_api_policy" {
  api_name            = azurerm_api_management_api.admin_api.name
  api_management_name = module.cgn_pe_apim.apim.name
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  xml_content = file("apis/backend_admin_api/v1/_base_policy.xml")
}
