module "cgn_storage" {
  source = "../_modules/storage"

  prefix          = local.prefix
  env_short       = local.env_short
  location        = local.location
  project         = local.project
  domain          = local.domain
  app_name        = ""
  instance_number = "01"

  resource_group_name = data.azurerm_resource_group.itn_cgn.name
  subnet_pep_id       = resource.azurerm_subnet.cgn_common_subnet_01.id
  action_group_id     = azurerm_monitor_action_group.io_p_itn_cgn_error_action_group.id

  tags = local.tags
}
