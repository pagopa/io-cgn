resource "azurerm_monitor_diagnostic_setting" "queue_diagnostic_setting" {
  name                       = "io-p-cgn-st-queue-ds-01"
  target_resource_id         = "${data.azurerm_storage_account.storage_cgn.id}/queueServices/default"
  log_analytics_workspace_id = data.azurerm_application_insights.common.workspace_id

  enabled_log {
    category = "StorageWrite"
  }

  metric {
    category = "Capacity"
    enabled  = false
  }
  metric {
    category = "Transaction"
    enabled  = false
  }
}


resource "azurerm_monitor_scheduled_query_rules_alert_v2" "pending_cgn_failure_alert_rule" {
  enabled             = true
  name                = "[CGN | iopstcgn] Failures on pendingcgn-poison"
  resource_group_name = azurerm_resource_group.itn_cgn.name
  location            = local.location

  scopes                  = [data.azurerm_storage_account.storage_cgn.id]
  description             = "Permanent failures processing Pending CGN. REQUIRED MANUAL ACTION"
  severity                = 1
  auto_mitigation_enabled = false

  window_duration      = "PT15M" # Select the interval that's used to group the data points by using the aggregation type function. Choose an Aggregation granularity (period) that's greater than the Frequency of evaluation to reduce the likelihood of missing the first evaluation period of an added time series.
  evaluation_frequency = "PT15M" # Select how often the alert rule is to be run. Select a frequency that's smaller than the aggregation granularity to generate a sliding window for the evaluation.

  criteria {
    query                   = <<-QUERY
      StorageQueueLogs
        | where OperationName has "PutMessage"
        | where Uri has "pendingcgn-poison"
      QUERY
    operator                = "GreaterThan"
    threshold               = 0
    time_aggregation_method = "Count"
  }

  action {
    action_groups = [
      azurerm_monitor_action_group.io_p_itn_cgn_error_action_group.id,
    ]
  }

  tags = local.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "pending_eyca_failure_alert_rule" {
  enabled             = true
  name                = "[CGN | iopstcgn] Failures on pendingeyca-poison"
  resource_group_name = azurerm_resource_group.itn_cgn.name
  location            = local.location

  scopes                  = [data.azurerm_storage_account.storage_cgn.id]
  description             = "Permanent failures processing Pending EYCA. REQUIRED MANUAL ACTION"
  severity                = 1
  auto_mitigation_enabled = false

  window_duration      = "PT15M" # Select the interval that's used to group the data points by using the aggregation type function. Choose an Aggregation granularity (period) that's greater than the Frequency of evaluation to reduce the likelihood of missing the first evaluation period of an added time series.
  evaluation_frequency = "PT15M" # Select how often the alert rule is to be run. Select a frequency that's smaller than the aggregation granularity to generate a sliding window for the evaluation.

  criteria {
    query                   = <<-QUERY
      StorageQueueLogs
        | where OperationName has "PutMessage"
        | where Uri has "pendingeyca-poison"
      QUERY
    operator                = "GreaterThan"
    threshold               = 0
    time_aggregation_method = "Count"
  }

  action {
    action_groups = [
      azurerm_monitor_action_group.io_p_itn_cgn_error_action_group.id,
    ]
  }

  tags = local.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "activated_cgn_failure_alert_rule" {
  enabled             = true
  name                = "[CGN | iopstcgn] Failures on activatedcgn-poison"
  resource_group_name = azurerm_resource_group.itn_cgn.name
  location            = local.location

  scopes                  = [data.azurerm_storage_account.storage_cgn.id]
  description             = "Permanent failures processing Activated CGN. REQUIRED MANUAL ACTION"
  severity                = 1
  auto_mitigation_enabled = false

  window_duration      = "PT15M" # Select the interval that's used to group the data points by using the aggregation type function. Choose an Aggregation granularity (period) that's greater than the Frequency of evaluation to reduce the likelihood of missing the first evaluation period of an added time series.
  evaluation_frequency = "PT15M" # Select how often the alert rule is to be run. Select a frequency that's smaller than the aggregation granularity to generate a sliding window for the evaluation.

  criteria {
    query                   = <<-QUERY
      StorageQueueLogs
        | where OperationName has "PutMessage"
        | where Uri has "activatedcgn-poison"
      QUERY
    operator                = "GreaterThan"
    threshold               = 0
    time_aggregation_method = "Count"
  }

  action {
    action_groups = [
      azurerm_monitor_action_group.io_p_itn_cgn_error_action_group.id,
    ]
  }

  tags = local.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "activated_eyca_failure_alert_rule" {
  enabled             = true
  name                = "[CGN | iopstcgn] Failures on activatedeyca-poison"
  resource_group_name = azurerm_resource_group.itn_cgn.name
  location            = local.location

  scopes                  = [data.azurerm_storage_account.storage_cgn.id]
  description             = "Permanent failures processing Activated EYCA. REQUIRED MANUAL ACTION"
  severity                = 1
  auto_mitigation_enabled = false

  window_duration      = "PT15M" # Select the interval that's used to group the data points by using the aggregation type function. Choose an Aggregation granularity (period) that's greater than the Frequency of evaluation to reduce the likelihood of missing the first evaluation period of an added time series.
  evaluation_frequency = "PT15M" # Select how often the alert rule is to be run. Select a frequency that's smaller than the aggregation granularity to generate a sliding window for the evaluation.

  criteria {
    query                   = <<-QUERY
      StorageQueueLogs
        | where OperationName has "PutMessage"
        | where Uri has "activatedeyca-poison"
      QUERY
    operator                = "GreaterThan"
    threshold               = 0
    time_aggregation_method = "Count"
  }

  action {
    action_groups = [
      azurerm_monitor_action_group.io_p_itn_cgn_error_action_group.id,
    ]
  }

  tags = local.tags
}

