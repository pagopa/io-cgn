module "function_app_cgn_search" {
  source = "github.com/pagopa/dx//infra/modules/azure_function_app?ref=5084d6f93194b71fdb40243e0d489d39cbe71958"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "search"
    instance_number = var.instance_number
  }

  app_service_plan_id = var.app_service_plan_id

  resource_group_name = var.resource_group_name
  health_check_path   = "/api/v1/cgn/operator-search/info"
  node_version        = 22

  subnet_id                            = var.subnet_id
  subnet_cidr                          = var.cidr_subnet_cgn_search_func
  subnet_pep_id                        = var.private_endpoint_subnet_id
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name

  # APP INSIGHTS
  application_insights_connection_string   = var.ai_connection_string
  application_insights_sampling_percentage = var.ai_sampling_percentage

  virtual_network = {
    name                = var.virtual_network.name
    resource_group_name = var.virtual_network.resource_group_name
  }

  app_settings      = local.cgn_search.app_settings
  slot_app_settings = local.cgn_search.app_settings

  tags = var.tags
}
