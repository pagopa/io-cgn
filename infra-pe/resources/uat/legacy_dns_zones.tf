###################################
# Old imported DNS Zone and Records
################################### 

resource "azurerm_dns_zone" "public" {
  name                = "cgnonboardingportal-uat.pagopa.it"
  resource_group_name = "cgnonboardingportal-u-public-rg"

  tags = local.tags
}

resource "azurerm_dns_a_record" "api" {
  name                = "api"
  records             = [module.application_gateway.agw.ip_address]
  resource_group_name = "cgnonboardingportal-u-public-rg"
  ttl                 = 300
  zone_name           = azurerm_dns_zone.public.name

  tags = local.tags
}

resource "azurerm_dns_cname_record" "portal" {
  name                = "portal"
  target_resource_id  = module.cgn_pe_fe.cdn.id # TODO: Fix with FE CDN Endpoint ID
  resource_group_name = "cgnonboardingportal-u-public-rg"
  ttl                 = 300
  zone_name           = azurerm_dns_zone.public.name

  tags = local.tags
}
