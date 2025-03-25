module "psql_pe_private_endpoint" {
  source = "../_modules/psql_pe_private_endpoint"

  location = local.location
  project  = local.project
  domain   = local.domain

  resource_group_name        = data.azurerm_resource_group.itn_cgn.name
  private_endpoint_subnet_id = data.azurerm_subnet.pep.id

  tags = local.tags
}
