module "functions_cgn_merchant" {
  source = "../_modules/function_app_merchant"

  prefix              = local.prefix
  env_short           = local.env_short
  location            = local.location
  project             = local.project
  domain              = local.domain
  resource_group_name = azurerm_resource_group.itn_cgn.name

  cidr_subnet_cgn_merchant_func    = "10.20.12.0/26"
  private_endpoint_subnet_id           = data.azurerm_subnet.pep.id
  private_dns_zone_resource_group_name = data.azurerm_resource_group.weu_common.name
  virtual_network = {
    resource_group_name = data.azurerm_virtual_network.vnet_common_itn.resource_group_name
    name                = data.azurerm_virtual_network.vnet_common_itn.name
  }

  redis_url      = module.redis_cgn.hostname
  redis_port     = module.redis_cgn.ssl_port
  redis_password = module.redis_cgn.primary_access_key

  tags = local.tags
}