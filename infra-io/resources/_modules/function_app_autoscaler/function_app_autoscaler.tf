module "function_app_autoscaler" {
  source = "github.com/pagopa/dx//infra/modules/azure_app_service_plan_autoscaler?ref=5084d6f93194b71fdb40243e0d489d39cbe71958"

  location            = var.location
  autoscale_name      = var.autoscale_name
  resource_group_name = var.resource_group_name
  app_service_plan_id = var.app_service_plan_id

  target_service = {
    function_apps = [
      {
        name = var.function_app_name
      }
    ]

  }

  scheduler = {
    maximum = 30
    normal_load = {
      default = 15
      minimum = 15
    }
  }

  scale_metrics = {
    cpu = {
      upper_threshold   = 50
      increase_by       = 2
      cooldown_increase = 3

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

