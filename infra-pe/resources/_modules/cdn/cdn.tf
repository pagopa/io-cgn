module "cgn_pe_cdn" {
  source  = "pagopa-dx/azure-cdn/azurerm"
  version = "0.2.0"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = var.app_name
    instance_number = var.instance_number
  }

  resource_group_name = var.resource_group_name

  origins = {
    storage = {
      host_name = var.host_name // storage prymary host
      priority  = 1
    }
  }

  custom_domains = [{
    host_name = "cdc.io.pagopa.it",
    dns = {
      zone_name                = "io.pagopa.it",
      zone_resource_group_name = "io-p-rg-external"
    }
  }]

  tags = var.tags
}

resource "azurerm_cdn_frontdoor_rule" "rewrite_index" {
  name                      = "RewriteIndex"
  cdn_frontdoor_rule_set_id = module.cdc_fe_cdn.rule_set_id
  order                     = 1
  behavior_on_match         = "Continue"

  actions {
    url_rewrite_action {
      source_pattern          = "/"
      destination             = "/index.html"
      preserve_unmatched_path = false
    }
  }

  conditions {
    request_uri_condition {
      operator         = "Contains"
      match_values     = ["/assets/"]
      negate_condition = true
    }
  }
}