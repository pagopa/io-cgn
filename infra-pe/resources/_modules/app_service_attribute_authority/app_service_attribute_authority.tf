module "app_service_attribute_authority" {
  source = "github.com/pagopa/dx//infra/modules/azure_app_service?ref=a08a2c9d95678902fd74382804693d33c8169e55"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "attribute-authority"
    instance_number = "01"
  }

  resource_group_name = var.resource_group_name
  health_check_path   = "/ping"
  node_version        = 22

  tier                = var.attribute_authority_tier
  app_service_plan_id = azurerm_service_plan.app_service_plan_attribute_authority.id

  # SETTINGS
  app_settings      = local.attribute_authority.app_settings
  slot_app_settings = local.attribute_authority.app_settings

  # SUBNET
  subnet_cidr                          = var.cidr_subnet_cgn_attribute_authority
  subnet_pep_id                        = var.private_endpoint_subnet_id
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name

  # APP INSIGHTS
  application_insights_connection_string   = var.ai_connection_string
  application_insights_sampling_percentage = var.ai_sampling_percentage

  virtual_network = {
    name                = var.virtual_network.name
    resource_group_name = var.virtual_network.resource_group_name
  }

  tags = var.tags

}
