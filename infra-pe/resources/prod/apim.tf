module "cgn_pe_apim" {
  source = "../_modules/apim"

  prefix    = local.prefix
  env_short = local.env_short
  location  = local.location
  domain    = local.domain

  resource_group_name = azurerm_resource_group.itn_cgn_pe.name
  tier                = "cost_optimized"
  virtual_network = {
    resource_group_name = module.networking.vnet_common.resource_group_name
    name                = module.networking.vnet_common.name
  }

  cidr_subnet_cgn_pe_apim    = "10.26.5.0/24"
  private_endpoint_subnet_id = module.networking.pep_snet.id

  tags = local.tags
}

resource "azurerm_api_management_policy" "apim_global_policy" {
  api_management_id = module.cgn_pe_apim.apim.id
  xml_content       = file("apis/_base_policy.xml")
}
