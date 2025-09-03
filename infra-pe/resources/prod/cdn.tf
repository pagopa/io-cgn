module "cgn_pe_fe" {
  source = "../_modules/cdn"

  prefix          = local.prefix
  env_short       = local.env_short
  project         = local.project
  location        = local.location
  domain          = local.domain
  app_name        = "frontend"
  instance_number = "01"

  custom_domain            = "portal.cgnonboardingportal.pagopa.it"
  zone_name                = "cgnonboardingportal.pagopa.it"
  zone_resource_group_name = "cgnonboardingportal-p-public-rg"

  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  tags = local.tags
}
