module "application_gateway" {
  source = "../_modules/application_gateway"

  prefix    = local.prefix
  env_short = local.env_short
  project   = local.project
  location  = local.location
  domain    = local.domain

  azure_subscription_id = data.azurerm_subscription.current.id
  resource_group_name   = azurerm_resource_group.itn_cgn_pe.name

  sku = {
    name = "WAF_v2"
    tier = "WAF_v2"
  }

  virtual_network = {
    resource_group_name = module.networking.vnet_common.resource_group_name
    name                = module.networking.vnet_common.name
  }

  cidr_subnet_cgn_pe_appgateway = "10.26.6.0/24"

  key_vault_name = module.key_vaults.key_vault_cgn_pe.name

  apim_hostname            = module.cgn_pe_apim.apim.gateway_hostname
  app_gw_cert_name         = "cgnonboardingportal-pagopa-it"
  app_gateway_min_capacity = 0
  app_gateway_max_capacity = 2

  app_gateway_alerts_enabled      = true
  azurerm_monitor_action_group_id = data.azurerm_monitor_action_group.ag_cgn_pe.id

  tags = local.tags
}
