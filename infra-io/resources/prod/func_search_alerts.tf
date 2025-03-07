resource "azurerm_monitor_scheduled_query_rules_alert_v2" "cgn_search_func_failure" {
  enabled             = true
  name                = "[CGN | AppIO] Failures in responding to App IO"
  resource_group_name = azurerm_resource_group.itn_cgn.name
  location            = local.location

  scopes                  = [data.azurerm_application_gateway.io_app_gateway.id]
  description             = "There have been some failures on /api/v1/cgn/operator-search/published-product-categories, citizens are being impacted."
  severity                = 1
  auto_mitigation_enabled = false

  window_duration      = "PT15M" # Select the interval that's used to group the data points by using the aggregation type function. Choose an Aggregation granularity (period) that's greater than the Frequency of evaluation to reduce the likelihood of missing the first evaluation period of an added time series.
  evaluation_frequency = "PT5M" # Select how often the alert rule is to be run. Select a frequency that's smaller than the aggregation granularity to generate a sliding window for the evaluation.

  criteria {
    query                   = <<-QUERY
      AzureDiagnostics
      | where originalHost_s in (datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"])
      | where requestUri_s matches regex "/api/v1/cgn/operator-search/published-product-categories"
      | where httpStatus_d >= 500
      QUERY
    operator                = "GreaterThan"
    threshold               = 10
    time_aggregation_method = "Count"
  }

  action {
    action_groups = [
      azurerm_monitor_action_group.io_p_itn_cgn_error_action_group.id,
    ]
  }

  tags = local.tags
}
