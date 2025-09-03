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
  host_name                      = azurerm_storage_account.cgn_pe_assets_storage.primary_web_host
  http_port                      = 80
  https_port                     = 443
  origin_host_header             = azurerm_storage_account.cgn_pe_assets_storage.primary_web_host
  priority                       = 1
  weight                         = 1000
  certificate_name_check_enabled = false
}

resource "azurerm_cdn_frontdoor_route" "this" {
  name                            = provider::dx::resource_name(merge(local.assets_naming_config, { resource_type = "cdn_frontdoor_route" }))
  cdn_frontdoor_endpoint_id       = azurerm_cdn_frontdoor_endpoint.this.id
  cdn_frontdoor_origin_group_id   = azurerm_cdn_frontdoor_origin_group.this.id
  cdn_frontdoor_origin_ids        = [azurerm_cdn_frontdoor_origin.this.id]
  cdn_frontdoor_rule_set_ids      = [module.cgn_pe_cdn.rule_set_id]
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
