resource "azurerm_api_management_product" "cgn_onboarding_portal_api_product" {
  product_id   = "cgn-onboarding-portal-api"
  display_name = "CGN ONBOARDING PORTAL API"
  description  = "CGN Onboarding Portal API"

  api_management_name = module.cgn_pe_apim.apim.name
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  published             = true
  subscription_required = true
  approval_required     = false
}

resource "azurerm_api_management_product_policy" "cgn_onboarding_portal_api_product" {
  product_id          = azurerm_api_management_product.cgn_onboarding_portal_api_product.product_id
  api_management_name = module.cgn_pe_apim.apim.name
  resource_group_name = azurerm_resource_group.itn_cgn_pe.name
  xml_content         = file("products/cgn_onboarding_portal_api_product/_base_policy.xml")
}
