resource "azurerm_api_management_api_version_set" "operator_v1" {
  name                = "operator_v1"
  api_management_name = module.cgn_pe_apim.apim.name
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name
  display_name        = "Operator API"
  versioning_scheme   = "Segment"
}

resource "azurerm_api_management_api" "operator_api" {
  name = format("%s-%s-operator-api", local.prefix, local.env_short)

  api_management_name = module.cgn_pe_apim.apim.name
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  subscription_required = false

  version_set_id = azurerm_api_management_api_version_set.operator_v1.id
  version        = "v1"
  revision       = "1"

  description  = "Operator API"
  display_name = "Operator API"
  path         = "api"
  protocols    = ["https"]

  import {
    content_format = "openapi-link"
    content_value  = "https://raw.githubusercontent.com/pagopa/cgn-onboarding-portal-backend/refs/tags/v2.1.5/openapi/openapi.yaml"
  }
}

resource "azurerm_api_management_api_policy" "operator_api_policy" {
  api_name            = azurerm_api_management_api.operator_api.name
  api_management_name = module.cgn_pe_apim.apim.name
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  xml_content = file("apis/backend_operator_api/v1/_base_policy.xml")
}
