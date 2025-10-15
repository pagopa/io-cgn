resource "azurerm_public_ip" "app_gw_public_ip" {
  name                = "${var.project}-cgn-pe-agw-pip-01"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = "Standard"
  allocation_method   = "Static"

  tags = var.tags
}

resource "azurerm_user_assigned_identity" "app_gw_identity" {
  resource_group_name = var.resource_group_name
  location            = var.location
  name                = "${var.project}-cgn-pe-agw-user-identity"

  tags = var.tags
}

module "appgateway_snet" {
  source               = "git::https://github.com/pagopa/terraform-azurerm-v4.git//subnet?ref=v7.40.3"
  name                 = "${var.project}-cgn-pe-agw-snet-01"
  address_prefixes     = [var.cidr_subnet_cgn_pe_appgateway]
  virtual_network_name = var.virtual_network.name
  resource_group_name  = var.resource_group_name
}

module "agw_identity_roles" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 1.0"

  principal_id    = azurerm_user_assigned_identity.app_gw_identity.principal_id
  subscription_id = var.azure_subscription_id

  key_vault = [
    {
      name                = var.key_vault_name
      resource_group_name = var.resource_group_name
      has_rbac_support    = true
      roles = {
        secrets = "reader"
      }
      description = "Allow AGW to access TLS certificates"
    }
  ]
}

module "app_gw" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v4.git//app_gateway?ref=v7.40.3"

  name                = "${var.project}-cgn-pe-agw-01"
  resource_group_name = var.resource_group_name
  location            = var.location

  # SKU
  sku_name = var.sku.name
  sku_tier = var.sku.tier

  # WAF
  waf_enabled = var.sku.tier == "WAF_v2" ? true : false
  waf_disabled_rule_group = var.sku.tier == "WAF_v2" ? [
    {
      rule_group_name = "REQUEST-920-PROTOCOL-ENFORCEMENT"
      rules           = ["920300", ]
    }
  ] : []

  # Networking
  subnet_id    = module.appgateway_snet.id
  public_ip_id = azurerm_public_ip.app_gw_public_ip.id

  # Configure backends
  backends = {

    apim = {
      protocol                    = "Https"
      host                        = var.apim_hostname
      port                        = 443
      ip_addresses                = null # with null value use fqdns
      fqdns                       = [var.apim_hostname]
      probe_name                  = "probe-apim"
      probe                       = "/status-0123456789abcdef"
      request_timeout             = 2
      pick_host_name_from_backend = false
    }
  }

  trusted_client_certificates = []

  ssl_profiles = [{
    name                             = "${var.project}-cgn-pe-ssl-profile"
    trusted_client_certificate_names = null
    verify_client_cert_issuer_dn     = false
    ssl_policy = {
      disabled_protocols = []
      policy_type        = "Custom"
      policy_name        = ""
      cipher_suites = [
        "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
        "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
        "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
        "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA"
      ]
      min_protocol_version = "TLSv1_2"
    }
  }]

  # Configure listeners
  listeners = {

    api = {
      protocol           = "Https"
      host               = "api.cgnonboardingportal${var.env_short == "u" ? "-uat" : ""}.pagopa.it"
      port               = 443
      ssl_profile_name   = "${var.project}-cgn-pe-ssl-profile"
      firewall_policy_id = null

      certificate = {
        name = var.app_gw_cert_name
        id = replace(
          data.azurerm_key_vault_certificate.app_gw_platform.secret_id,
          "/${data.azurerm_key_vault_certificate.app_gw_platform.version}",
          ""
        )
      }
    }
  }

  # maps listener to backend
  routes = {
    api = {
      listener              = "api"
      backend               = "apim"
      rewrite_rule_set_name = "rewrite-rule-set-api"
      priority              = 1
    }
  }

  rewrite_rule_sets = []

  # TLS
  identity_ids = [azurerm_user_assigned_identity.app_gw_identity.id]

  # Scaling
  app_gateway_min_capacity = var.app_gateway_min_capacity
  app_gateway_max_capacity = var.app_gateway_max_capacity

  alerts_enabled = var.app_gateway_alerts_enabled

  action = [
    {
      action_group_id    = var.azurerm_monitor_action_group_id
      webhook_properties = null
    }
  ]

  monitor_metric_alert_criteria = {

    compute_units_usage = {
      description   = "Abnormal compute units usage, probably an high traffic peak"
      frequency     = "PT5M"
      window_size   = "PT5M"
      severity      = 2
      auto_mitigate = true

      criteria = []
      dynamic_criteria = [
        {
          aggregation              = "Average"
          metric_name              = "ComputeUnits"
          operator                 = "GreaterOrLessThan"
          alert_sensitivity        = "High"
          evaluation_total_count   = 2
          evaluation_failure_count = 2
          dimension                = []
        }
      ]
    }

    backend_pools_status = {
      description   = "One or more backend pools are down, check Backend Health on Azure portal"
      frequency     = "PT5M"
      window_size   = "PT5M"
      severity      = 0
      auto_mitigate = true

      criteria = [
        {
          aggregation = "Average"
          metric_name = "UnhealthyHostCount"
          operator    = "GreaterThan"
          threshold   = 0
          dimension   = []
        }
      ]
      dynamic_criteria = []
    }

    response_time = {
      description   = "Backends response time is too high"
      frequency     = "PT5M"
      window_size   = "PT5M"
      severity      = 2
      auto_mitigate = true

      criteria = []
      dynamic_criteria = [
        {
          aggregation              = "Average"
          metric_name              = "BackendLastByteResponseTime"
          operator                 = "GreaterThan"
          alert_sensitivity        = "High"
          evaluation_total_count   = 2
          evaluation_failure_count = 2
          dimension                = []
        }
      ]
    }

    total_requests = {
      description   = "Traffic is raising"
      frequency     = "PT5M"
      window_size   = "PT15M"
      severity      = 3
      auto_mitigate = true

      criteria = []
      dynamic_criteria = [
        {
          aggregation              = "Total"
          metric_name              = "TotalRequests"
          operator                 = "GreaterThan"
          alert_sensitivity        = "Medium"
          evaluation_total_count   = 1
          evaluation_failure_count = 1
          dimension                = []
        }
      ]
    }

    failed_requests = {
      description   = "Abnormal failed requests"
      frequency     = "PT5M"
      window_size   = "PT5M"
      severity      = 1
      auto_mitigate = true

      criteria = []
      dynamic_criteria = [
        {
          aggregation              = "Total"
          metric_name              = "FailedRequests"
          operator                 = "GreaterThan"
          alert_sensitivity        = "High"
          evaluation_total_count   = 2
          evaluation_failure_count = 2
          dimension                = []
        }
      ]
    }
  }

  tags = var.tags
}
