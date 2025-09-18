module "cgn_pe_cdn" {
  source  = "pagopa-dx/azure-cdn/azurerm"
  version = "~> 0.2"

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
    website = {
      host_name = azurerm_storage_account.cgn_pe_fe_storage.primary_web_host
      priority  = 1
    }
  }

  custom_domains = [{
    host_name = var.custom_domain // custom domain,
    dns = {
      zone_name                = var.zone_name,
      zone_resource_group_name = var.zone_resource_group_name
    }
  }]

  tags = var.tags
}

resource "azurerm_cdn_frontdoor_endpoint" "this" {
  name                     = provider::dx::resource_name(merge(local.assets_naming_config, { resource_type = "cdn_frontdoor_endpoint" }))
  cdn_frontdoor_profile_id = module.cgn_pe_cdn.id

  tags = var.tags
}

resource "azurerm_cdn_frontdoor_origin_group" "this" {
  name                     = provider::dx::resource_name(merge(local.assets_naming_config, { resource_type = "cdn_frontdoor_origin_group" }))
  cdn_frontdoor_profile_id = module.cgn_pe_cdn.id

  health_probe {
    interval_in_seconds = 100
    protocol            = "Https"
  }

  load_balancing {}
}

resource "azurerm_cdn_frontdoor_origin" "this" {
  name = provider::dx::resource_name(merge(local.assets_naming_config, {
    resource_type = "cdn_frontdoor_origin"
  }))
  cdn_frontdoor_origin_group_id  = azurerm_cdn_frontdoor_origin_group.this.id
  enabled                        = true
  host_name                      = azurerm_storage_account.cgn_pe_assets_storage.primary_blob_host
  http_port                      = 80
  https_port                     = 443
  origin_host_header             = azurerm_storage_account.cgn_pe_assets_storage.primary_blob_host
  priority                       = 1
  weight                         = 1000
  certificate_name_check_enabled = false
}

resource "azurerm_cdn_frontdoor_rule_set" "assets_ruleset" {
  name                     = "assetsruleset"
  cdn_frontdoor_profile_id = module.cgn_pe_cdn.id
}

resource "azurerm_cdn_frontdoor_route" "this" {
  name                            = provider::dx::resource_name(merge(local.assets_naming_config, { resource_type = "cdn_frontdoor_route" }))
  cdn_frontdoor_endpoint_id       = azurerm_cdn_frontdoor_endpoint.this.id
  cdn_frontdoor_origin_group_id   = azurerm_cdn_frontdoor_origin_group.this.id
  cdn_frontdoor_origin_ids        = [azurerm_cdn_frontdoor_origin.this.id]
  cdn_frontdoor_rule_set_ids      = [azurerm_cdn_frontdoor_rule_set.assets_ruleset.id]
  cdn_frontdoor_custom_domain_ids = []
  enabled                         = true

  forwarding_protocol    = "HttpsOnly"
  https_redirect_enabled = true
  patterns_to_match      = ["/*"]
  supported_protocols    = ["Http", "Https"]

  link_to_default_domain = true

  cache {
    query_string_caching_behavior = "IgnoreQueryString"
  }
}

################
# FE CDN Rules #
################
resource "azurerm_cdn_frontdoor_rule" "global" {
  name                      = "Global"
  cdn_frontdoor_rule_set_id = module.cgn_pe_cdn.rule_set_id
  order                     = 1
  behavior_on_match         = "Continue"

  actions {
    response_header_action {
      header_action = "Overwrite"
      header_name   = "Strict-Transport-Security"
      value         = "max-age=31536000"
    }
  }
}

resource "azurerm_cdn_frontdoor_rule" "enforce_https" {
  name                      = "EnforceHTTPS"
  cdn_frontdoor_rule_set_id = module.cgn_pe_cdn.rule_set_id
  order                     = 2
  behavior_on_match         = "Continue"

  actions {
    url_redirect_action {
      redirect_type        = "Found"
      redirect_protocol    = "Https"
      destination_hostname = ""
    }
  }

  conditions {
    request_scheme_condition {
      operator         = "Equal"
      match_values     = ["HTTP"]
      negate_condition = false
    }
  }
}

resource "azurerm_cdn_frontdoor_rule" "rewrite_session_rout" {
  name                      = "RewriteSessionRoute"
  cdn_frontdoor_rule_set_id = module.cgn_pe_cdn.rule_set_id
  order                     = 3
  behavior_on_match         = "Continue"

  actions {
    url_rewrite_action {
      source_pattern          = "/session"
      destination             = "/index.html"
      preserve_unmatched_path = false
    }
  }

  conditions {
    request_uri_condition {
      operator         = "Contains"
      match_values     = ["/session"]
      negate_condition = false
    }
  }
}

resource "azurerm_cdn_frontdoor_rule" "rewrite_admin_rout" {
  name                      = "RewriteAdminRoute"
  cdn_frontdoor_rule_set_id = module.cgn_pe_cdn.rule_set_id
  order                     = 4
  behavior_on_match         = "Continue"

  actions {
    url_rewrite_action {
      source_pattern          = "/admin/"
      destination             = "/index.html"
      preserve_unmatched_path = false
    }
  }

  conditions {
    request_uri_condition {
      operator         = "Contains"
      match_values     = ["/admin/"]
      negate_condition = false
    }
  }
}

resource "azurerm_cdn_frontdoor_rule" "caching" {
  name                      = "Caching"
  cdn_frontdoor_rule_set_id = module.cgn_pe_cdn.rule_set_id
  order                     = 5
  behavior_on_match         = "Continue"

  actions {
    route_configuration_override_action {
      cache_behavior                = "HonorOrigin"
      compression_enabled           = true
      query_string_caching_behavior = "IgnoreQueryString"
    }

    response_header_action {
      header_action = "Overwrite"
      header_name   = "Cache-Control"
      value         = "no-cache"
    }
  }

  conditions {
    url_path_condition {
      operator = "Any"
    }
  }
}

####################
# ASSETS CDN Rules #
####################
resource "azurerm_cdn_frontdoor_rule" "global_assets" {
  name                      = "Global"
  cdn_frontdoor_rule_set_id = azurerm_cdn_frontdoor_rule_set.assets_ruleset.id
  order                     = 1
  behavior_on_match         = "Continue"

  actions {
    route_configuration_override_action {
      cache_behavior                = "OverrideAlways"
      compression_enabled           = false
      query_string_caching_behavior = "IgnoreQueryString"
      cache_duration                = "01:00:00"
    }

    response_header_action {
      header_action = "Overwrite"
      header_name   = "Strict-Transport-Security"
      value         = "max-age=31536000"
    }

    response_header_action {
      header_action = "Overwrite"
      header_name   = "Content-Security-Policy-Report-Only"
      value         = "default-src 'self'; frame-ancestors 'self'; script-src 'self'; style-src 'self'"
    }
  }
}

resource "azurerm_cdn_frontdoor_rule" "enforce_https_assets" {
  name                      = "EnforceHTTPS"
  cdn_frontdoor_rule_set_id = azurerm_cdn_frontdoor_rule_set.assets_ruleset.id
  order                     = 2
  behavior_on_match         = "Continue"

  actions {
    url_redirect_action {
      redirect_type        = "Found"
      redirect_protocol    = "Https"
      destination_hostname = ""
    }
  }

  conditions {
    request_scheme_condition {
      operator         = "Equal"
      match_values     = ["HTTP"]
      negate_condition = false
    }
  }
}

resource "azurerm_cdn_frontdoor_rule" "profile_images_cache" {
  name                      = "ProfileImagesCache"
  cdn_frontdoor_rule_set_id = azurerm_cdn_frontdoor_rule_set.assets_ruleset.id
  order                     = 3
  behavior_on_match         = "Continue"

  actions {
    route_configuration_override_action {
      cache_behavior                = "OverrideAlways"
      compression_enabled           = false
      query_string_caching_behavior = "IgnoreQueryString"
      cache_duration                = "00:15:00"
    }
  }

  conditions {
    url_path_condition {
      operator         = "BeginsWith"
      match_values     = ["/profileimages"]
      negate_condition = false
    }
  }
}
