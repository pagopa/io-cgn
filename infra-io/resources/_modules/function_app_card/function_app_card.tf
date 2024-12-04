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

  # APP INSIGHTS
  application_insights_connection_string   = var.ai_connection_string
  application_insights_sampling_percentage = var.ai_sampling_percentage

  virtual_network = {
    name                = var.virtual_network.name
    resource_group_name = var.virtual_network.resource_group_name
  }

  app_settings = local.cgn_card.app_settings

  slot_app_settings = merge(
    local.cgn_card.app_settings, {
      // disable queue triggered functions on staging slot
      "AzureWebJobs.CgnActivation_2_ProcessPendingQueue.Disabled"         = "1"
      "AzureWebJobs.CgnActivation_3_ProcessActivatedQueue.Disabled"       = "1"
      "AzureWebJobs.EycaActivation_2_ProcessPendingQueue.Disabled"        = "1"
      "AzureWebJobs.EycaActivation_3_ProcessActivatedQueue.Disabled"      = "1"
      "AzureWebJobs.CardsDelete_2_ProcessPendingDeleteCgnQueue.Disabled"  = "1"
      "AzureWebJobs.CardsDelete_3_ProcessPendingDeleteEycaQueue.Disabled" = "1"
      "AzureWebJobs.CgnExpired_1_Start.Disabled"                          = "1"
      "AzureWebJobs.CgnExpired_2_ProcessExpiredCgnQueue.Disabled"         = "1"
      "AzureWebJobs.EycaExpired_1_Start.Disabled"                         = "1"
      "AzureWebJobs.EycaExpired_2_ProcessExpiredEycaQueue.Disabled"       = "1"
      "AzureWebJobs.SendMessage_ProcessMessagesQueue.Disabled"            = "1"
  })

  sticky_app_setting_names = [
    "AzureWebJobs.CgnActivation_2_ProcessPendingQueue.Disabled",
    "AzureWebJobs.CgnActivation_3_ProcessActivatedQueue.Disabled",
    "AzureWebJobs.EycaActivation_2_ProcessPendingQueue.Disabled",
    "AzureWebJobs.EycaActivation_3_ProcessActivatedQueue.Disabled",
    "AzureWebJobs.CardsDelete_2_ProcessPendingDeleteCgnQueue.Disabled",
    "AzureWebJobs.CardsDelete_3_ProcessPendingDeleteEycaQueue.Disabled",
    "AzureWebJobs.CgnExpired_1_Start.Disabled",
    "AzureWebJobs.CgnExpired_2_ProcessExpiredCgnQueue.Disabled",
    "AzureWebJobs.EycaExpired_1_Start.Disabled",
    "AzureWebJobs.EycaExpired_2_ProcessExpiredEycaQueue.Disabled",
    "AzureWebJobs.SendMessage_ProcessMessagesQueue.Disabled"
  ]

  tags = var.tags
}

# NAT Gateway

resource "azurerm_subnet_nat_gateway_association" "functions_messages_citizen_subnet" {
  subnet_id      = module.function_app_cgn_card.subnet.id
  nat_gateway_id = var.nat_gateway_id
}

# Autoscaler

module "function_cgn_card_autoscaler" {
  source = "github.com/pagopa/dx//infra/modules/azure_app_service_plan_autoscaler?ref=main"

  resource_group_name = var.resource_group_name

  target_service = {
    function_app_name = module.function_app_cgn_card.function_app.function_app.name
  }

  scheduler = {
    maximum = 10
    normal_load = {
      default = 6
      minimum = 3
    }
  }

  scale_metrics = {
    cpu = {
      upper_threshold   = 70
      increase_by       = 2
      cooldown_increase = 2

      lower_threshold   = 15
      decrease_by       = 1
      cooldown_decrease = 1
    }
    requests = {
      upper_threshold           = 450
      increase_by               = 2
      cooldown_increase         = 1
      statistic_increase        = "Average"
      time_aggregation_increase = "Average"

      lower_threshold   = 75
      decrease_by       = 1
      cooldown_decrease = 1
    }
  }

  tags = var.tags
}

