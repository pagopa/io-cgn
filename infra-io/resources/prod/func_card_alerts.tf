#########################
# APP IO FAILURE ALERTS #
#########################

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "cgn_card_func_cgn_activation_failure" {
  enabled             = true
  name                = "[CGN | AppIO] App IO cannot activate CGN"
  resource_group_name = azurerm_resource_group.itn_cgn.name
  location            = local.location

  scopes                  = [data.azurerm_application_gateway.io_app_gateway.id]
  description             = "There have been some failures on /api/v1/cgn/activation, citizens are being impacted."
  severity                = 1
  auto_mitigation_enabled = false

  window_duration      = "PT15M" # Select the interval that's used to group the data points by using the aggregation type function. Choose an Aggregation granularity (period) that's greater than the Frequency of evaluation to reduce the likelihood of missing the first evaluation period of an added time series.
  evaluation_frequency = "PT5M" # Select how often the alert rule is to be run. Select a frequency that's smaller than the aggregation granularity to generate a sliding window for the evaluation.

  criteria {
    query                   = <<-QUERY
      AzureDiagnostics
      | where originalHost_s in (datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"])
      | where requestUri_s matches regex "/api/v1/cgn/activation"
      | where httpStatus_d >= 500
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

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "cgn_card_func_eyca_activation_failure" {
  enabled             = true
  name                = "[CGN | AppIO] App IO cannot activate EYCA"
  resource_group_name = azurerm_resource_group.itn_cgn.name
  location            = local.location

  scopes                  = [data.azurerm_application_gateway.io_app_gateway.id]
  description             = "There have been some failures on /api/v1/cgn/eyca/activation, citizens are being impacted."
  severity                = 1
  auto_mitigation_enabled = false

  window_duration      = "PT15M" # Select the interval that's used to group the data points by using the aggregation type function. Choose an Aggregation granularity (period) that's greater than the Frequency of evaluation to reduce the likelihood of missing the first evaluation period of an added time series.
  evaluation_frequency = "PT5M" # Select how often the alert rule is to be run. Select a frequency that's smaller than the aggregation granularity to generate a sliding window for the evaluation.

  criteria {
    query                   = <<-QUERY
      AzureDiagnostics
      | where originalHost_s in (datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"])
      | where requestUri_s matches regex "/api/v1/cgn/eyca/activation"
      | where httpStatus_d >= 500
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

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "cgn_card_func_cgn_delete_failure" {
  enabled             = true
  name                = "[CGN | AppIO] App IO cannot delete CGN"
  resource_group_name = azurerm_resource_group.itn_cgn.name
  location            = local.location

  scopes                  = [data.azurerm_application_gateway.io_app_gateway.id]
  description             = "There have been some failures on /api/v1/cgn/delete, citizens are being impacted."
  severity                = 1
  auto_mitigation_enabled = false

  window_duration      = "PT15M" # Select the interval that's used to group the data points by using the aggregation type function. Choose an Aggregation granularity (period) that's greater than the Frequency of evaluation to reduce the likelihood of missing the first evaluation period of an added time series.
  evaluation_frequency = "PT5M" # Select how often the alert rule is to be run. Select a frequency that's smaller than the aggregation granularity to generate a sliding window for the evaluation.

  criteria {
    query                   = <<-QUERY
      AzureDiagnostics
      | where originalHost_s in (datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"])
      | where requestUri_s matches regex "/api/v1/cgn/delete"
      | where httpStatus_d >= 500
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

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "cgn_card_func_get_otp_failure" {
  enabled             = true
  name                = "[CGN | AppIO] App IO cannot retrieve OTP"
  resource_group_name = azurerm_resource_group.itn_cgn.name
  location            = local.location

  scopes                  = [data.azurerm_application_gateway.io_app_gateway.id]
  description             = "There have been some failures on /api/v1/cgn/otp, citizens are being impacted."
  severity                = 1
  auto_mitigation_enabled = false

  window_duration      = "PT15M" # Select the interval that's used to group the data points by using the aggregation type function. Choose an Aggregation granularity (period) that's greater than the Frequency of evaluation to reduce the likelihood of missing the first evaluation period of an added time series.
  evaluation_frequency = "PT5M" # Select how often the alert rule is to be run. Select a frequency that's smaller than the aggregation granularity to generate a sliding window for the evaluation.

  criteria {
    query                   = <<-QUERY
      AzureDiagnostics
      | where originalHost_s in (datatable (name: string) ["app-backend.io.italia.it", "api-app.io.pagopa.it"])
      | where requestUri_s matches regex "/api/v1/cgn/otp"
      | where httpStatus_d >= 500
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

###############################
# POISON QUEUE STORAGE ALERTS #
###############################

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

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "pendingdelete_cgn_failure_alert_rule" {
  enabled             = true
  name                = "[CGN | iopstcgn] Failures on pendingdeletecgn-poison"
  resource_group_name = azurerm_resource_group.itn_cgn.name
  location            = local.location

  scopes                  = [data.azurerm_storage_account.storage_cgn.id]
  description             = "Permanent failures processing Pending Delete CGN. REQUIRED MANUAL ACTION"
  severity                = 1
  auto_mitigation_enabled = false

  window_duration      = "PT15M" # Select the interval that's used to group the data points by using the aggregation type function. Choose an Aggregation granularity (period) that's greater than the Frequency of evaluation to reduce the likelihood of missing the first evaluation period of an added time series.
  evaluation_frequency = "PT15M" # Select how often the alert rule is to be run. Select a frequency that's smaller than the aggregation granularity to generate a sliding window for the evaluation.

  criteria {
    query                   = <<-QUERY
      StorageQueueLogs
        | where OperationName has "PutMessage"
        | where Uri has "pendingdeletecgn-poison"
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

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "pendingdelete_eyca_failure_alert_rule" {
  enabled             = true
  name                = "[CGN | iopstcgn] Failures on pendingdeleteeyca-poison"
  resource_group_name = azurerm_resource_group.itn_cgn.name
  location            = local.location

  scopes                  = [data.azurerm_storage_account.storage_cgn.id]
  description             = "Permanent failures processing Pending Delete EYCA. REQUIRED MANUAL ACTION"
  severity                = 1
  auto_mitigation_enabled = false

  window_duration      = "PT15M" # Select the interval that's used to group the data points by using the aggregation type function. Choose an Aggregation granularity (period) that's greater than the Frequency of evaluation to reduce the likelihood of missing the first evaluation period of an added time series.
  evaluation_frequency = "PT15M" # Select how often the alert rule is to be run. Select a frequency that's smaller than the aggregation granularity to generate a sliding window for the evaluation.

  criteria {
    query                   = <<-QUERY
      StorageQueueLogs
        | where OperationName has "PutMessage"
        | where Uri has "pendingdeleteeyca-poison"
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

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "expired_cgn_failure_alert_rule" {
  enabled             = true
  name                = "[CGN | iopstcgn] Failures on expiredcgn-poison"
  resource_group_name = azurerm_resource_group.itn_cgn.name
  location            = local.location

  scopes                  = [data.azurerm_storage_account.storage_cgn.id]
  description             = "Permanent failures processing Expired CGN. REQUIRED MANUAL ACTION"
  severity                = 1
  auto_mitigation_enabled = false

  window_duration      = "PT15M" # Select the interval that's used to group the data points by using the aggregation type function. Choose an Aggregation granularity (period) that's greater than the Frequency of evaluation to reduce the likelihood of missing the first evaluation period of an added time series.
  evaluation_frequency = "PT15M" # Select how often the alert rule is to be run. Select a frequency that's smaller than the aggregation granularity to generate a sliding window for the evaluation.

  criteria {
    query                   = <<-QUERY
      StorageQueueLogs
        | where OperationName has "PutMessage"
        | where Uri has "expiredcgn-poison"
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

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "expired_eyca_failure_alert_rule" {
  enabled             = true
  name                = "[CGN | iopstcgn] Failures on expiredeyca-poison"
  resource_group_name = azurerm_resource_group.itn_cgn.name
  location            = local.location

  scopes                  = [data.azurerm_storage_account.storage_cgn.id]
  description             = "Permanent failures processing Expired EYCA. REQUIRED MANUAL ACTION"
  severity                = 1
  auto_mitigation_enabled = false

  window_duration      = "PT15M" # Select the interval that's used to group the data points by using the aggregation type function. Choose an Aggregation granularity (period) that's greater than the Frequency of evaluation to reduce the likelihood of missing the first evaluation period of an added time series.
  evaluation_frequency = "PT15M" # Select how often the alert rule is to be run. Select a frequency that's smaller than the aggregation granularity to generate a sliding window for the evaluation.

  criteria {
    query                   = <<-QUERY
      StorageQueueLogs
        | where OperationName has "PutMessage"
        | where Uri has "expiredeyca-poison"
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

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "messages_failure_alert_rule" {
  enabled             = true
  name                = "[CGN | iopstcgn] Failures on messages-poison"
  resource_group_name = azurerm_resource_group.itn_cgn.name
  location            = local.location

  scopes                  = [data.azurerm_storage_account.storage_cgn.id]
  description             = "Permanent failures processing Messages. REQUIRED MANUAL ACTION"
  severity                = 1
  auto_mitigation_enabled = false

  window_duration      = "PT15M" # Select the interval that's used to group the data points by using the aggregation type function. Choose an Aggregation granularity (period) that's greater than the Frequency of evaluation to reduce the likelihood of missing the first evaluation period of an added time series.
  evaluation_frequency = "PT15M" # Select how often the alert rule is to be run. Select a frequency that's smaller than the aggregation granularity to generate a sliding window for the evaluation.

  criteria {
    query                   = <<-QUERY
      StorageQueueLogs
        | where OperationName has "PutMessage"
        | where Uri has "messages-poison"
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

###############################
# FUNCTIONS EXECUTIONS ALERTS #
###############################

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "cgn_scheduled_expired_cgn_failure" {
  enabled             = true
  name                = "[CGN | Scheduled Jobs] Scheduled CgnExpired_1_Start failed"
  resource_group_name = azurerm_resource_group.itn_cgn.name
  location            = local.location

  scopes                  = [data.azurerm_application_insights.common.id]
  description             = "Scheduled CgnExpired_1_Start job has failed. REQUIRED MANUAL ACTION."
  severity                = 1
  auto_mitigation_enabled = false

  window_duration      = "P1D" # Select the interval that's used to group the data points by using the aggregation type function. Choose an Aggregation granularity (period) that's greater than the Frequency of evaluation to reduce the likelihood of missing the first evaluation period of an added time series.
  evaluation_frequency = "P1D" # Select how often the alert rule is to be run. Select a frequency that's smaller than the aggregation granularity to generate a sliding window for the evaluation.

  criteria {
    query                   = <<-QUERY
      requests
      | where success = false
      | where operation_Name =~ 'CgnExpired_1_Start'
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

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "cgn_scheduled_expired_eyca_failure" {
  enabled             = true
  name                = "[CGN | Scheduled Jobs] Scheduled EycaExpired_1_Start failed"
  resource_group_name = azurerm_resource_group.itn_cgn.name
  location            = local.location

  scopes                  = [data.azurerm_application_insights.common.id]
  description             = "Scheduled EycaExpired_1_Start job has failed. REQUIRED MANUAL ACTION."
  severity                = 1
  auto_mitigation_enabled = false

  window_duration      = "P1D" # Select the interval that's used to group the data points by using the aggregation type function. Choose an Aggregation granularity (period) that's greater than the Frequency of evaluation to reduce the likelihood of missing the first evaluation period of an added time series.
  evaluation_frequency = "P1D" # Select how often the alert rule is to be run. Select a frequency that's smaller than the aggregation granularity to generate a sliding window for the evaluation.

  criteria {
    query                   = <<-QUERY
      requests
      | where success = false
      | where operation_Name =~ 'EycaExpired_1_Start'
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