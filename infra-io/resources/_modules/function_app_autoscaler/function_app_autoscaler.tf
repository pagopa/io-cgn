module "function_app_autoscaler" {
  source = "github.com/pagopa/dx//infra/modules/azure_app_service_plan_autoscaler?ref=5fe5d992a856636e2f49f6720a2b735dd77f1696"

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

