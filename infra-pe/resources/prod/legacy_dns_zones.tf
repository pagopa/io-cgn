###################################
# Old imported DNS Zone and Records
################################### 

resource "azurerm_dns_zone" "public" {
  name                = "cgnonboardingportal.pagopa.it"
  resource_group_name = "cgnonboardingportal-p-public-rg"

  tags = local.tags
}

resource "azurerm_dns_a_record" "api" {
  name                = "api"
  records             = [module.application_gateway.agw.ip_address]
  resource_group_name = "cgnonboardingportal-p-public-rg"
  ttl                 = 300
  zone_name           = azurerm_dns_zone.public.name

  tags = local.tags
}

resource "azurerm_dns_cname_record" "portal" {
  name                = "portal"
  target_resource_id  = module.cgn_pe_fe.cdn.endpoint_id
  resource_group_name = "cgnonboardingportal-p-public-rg"
  ttl                 = 300
  zone_name           = azurerm_dns_zone.public.name

  tags = local.tags
}
