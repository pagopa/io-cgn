module "cgn_pe_fe" {
  source = "../_modules/cdn"

  project  = local.project
  location = local.location
  domain   = local.domain

  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  tags = local.tags
}
