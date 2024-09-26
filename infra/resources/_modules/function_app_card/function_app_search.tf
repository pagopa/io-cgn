module "function_app_cgn_card" {
  source = "github.com/pagopa/dx//infra/modules/azure_function_app?ref=main"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "card"
    instance_number = "01"
  }

  resource_group_name = var.resource_group_name
  health_check_path   = "/api/v1/cgn/health"
  node_version        = 20

  subnet_cidr                          = var.cidr_subnet_cgn_card_func
  subnet_pep_id                        = var.private_endpoint_subnet_id
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name

  virtual_network = {
    name                = var.virtual_network.name
    resource_group_name = var.virtual_network.resource_group_name
  }

  app_settings      = local.cgn_card.app_settings
  slot_app_settings = local.cgn_card.app_settings

  tags = var.tags
}