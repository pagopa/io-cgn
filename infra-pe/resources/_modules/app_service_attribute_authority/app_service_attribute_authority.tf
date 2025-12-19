module "app_service_attribute_authority" {
  source  = "pagopa-dx/azure-app-service/azurerm"
  version = "~> 2.0"

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

  size = var.attribute_authority_tier

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
