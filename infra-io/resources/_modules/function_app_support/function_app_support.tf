module "function_app_cgn_support" {
  source = "github.com/pagopa/dx//infra/modules/azure_function_app?ref=5fe5d992a856636e2f49f6720a2b735dd77f1696"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "support"
    instance_number = var.instance_number
  }

  app_service_plan_id = var.app_service_plan_id

  resource_group_name = var.resource_group_name
  health_check_path   = "/api/v1/cgn-support/health"
  node_version        = 22

  subnet_id                            = var.subnet_id
  subnet_cidr                          = var.cidr_subnet_cgn_support_func
  subnet_pep_id                        = var.private_endpoint_subnet_id
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name

  # APP INSIGHTS
  application_insights_connection_string   = var.ai_connection_string
  application_insights_sampling_percentage = var.ai_sampling_percentage

  virtual_network = {
    name                = var.virtual_network.name
    resource_group_name = var.virtual_network.resource_group_name
  }

  app_settings = local.cgn_support.app_settings

  slot_app_settings = local.cgn_support.app_settings

  sticky_app_setting_names = []

  tags = var.tags
}
