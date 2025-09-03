module "cgn_pe_apim" {
  source = "../_modules/apim"

  prefix    = local.prefix
  env_short = local.env_short
  location  = local.location
  domain    = local.domain

  resource_group_name = azurerm_resource_group.itn_cgn_pe.name
  tier                = "m"
  virtual_network = {
    resource_group_name = module.networking.vnet_common.resource_group_name
    name                = module.networking.vnet_common.name
  }

  cidr_subnet_cgn_pe_apim = "10.25.5.0/24"

  tags = local.tags
}
