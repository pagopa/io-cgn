module "redis_cgn_03" {
  source  = "pagopa-dx/azure-managed-redis/azurerm"
  version = "3.0.1"

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location
    domain          = local.domain
    app_name        = "redis"
    instance_number = "03"
  }

  resource_group_name = data.azurerm_resource_group.itn_cgn.name

  use_case          = "default"
  sku_name_override = "Balanced_B1"

  virtual_network_id = data.azurerm_virtual_network.vnet_common_itn.id
  # The privatelink.redis.azure.net zone already exists in the legacy common resource group
  private_dns_zone_resource_group_name = data.azurerm_resource_group.weu_common.name

  log_analytics_workspace_id = data.azurerm_application_insights.common.workspace_id

  alerts = {
    action_group_id = azurerm_monitor_action_group.io_p_itn_cgn_error_action_group.id
  }

  tags = local.tags
}

module "redis_cgn_03_role_assignments" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "5.0.1"

  for_each = toset([
    module.functions_cgn_card_02.function_app_cgn_card.principal_id,
    module.functions_cgn_card_02.function_app_cgn_card.staging_principal_id,
    module.functions_cgn_merchant_02.function_app_cgn_merchant.principal_id,
    module.functions_cgn_merchant_02.function_app_cgn_merchant.staging_principal_id,
    module.functions_cgn_search_02.function_app_cgn_search.principal_id,
    module.functions_cgn_search_02.function_app_cgn_search.staging_principal_id,
  ])

  principal_id    = each.value
  subscription_id = data.azurerm_client_config.current.subscription_id

  managed_redis = [
    {
      id          = module.redis_cgn_03.id
      role        = "writer"
      description = "Allow function to read and write data on the CGN managed Redis"
    }
  ]
}
