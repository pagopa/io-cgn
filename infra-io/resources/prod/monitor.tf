data "azurerm_key_vault_secret" "alert_error_notification_email" {
  name         = "ALERT-NOTIFICATION-EMAIL"
  key_vault_id = module.key_vaults.key_vault_cgn.id
}

data "azurerm_key_vault_secret" "alert_error_notification_slack" {
  name         = "ALERT-NOTIFICATION-SLACK"
  key_vault_id = module.key_vaults.key_vault_cgn.id
}

resource "azurerm_monitor_action_group" "io_p_itn_cgn_error_action_group" {
  resource_group_name = azurerm_resource_group.itn_cgn.name
  name                = "${local.project}-${local.domain}-error-ag-01"
  short_name          = "iopitnceag01"

  email_receiver {
    name                    = "email"
    email_address           = data.azurerm_key_vault_secret.alert_error_notification_email.value
    use_common_alert_schema = true
  }

  email_receiver {
    name                    = "slack"
    email_address           = data.azurerm_key_vault_secret.alert_error_notification_slack.value
    use_common_alert_schema = true
  }

  tags = local.tags
}
