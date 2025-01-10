resource "azurerm_private_dns_a_record" "weu_pep" {
  for_each            = { for k, v in module.app_service_attribute_authority.app_service.app_service.pep_record_sets : v.name => v }
  name                = each.value.name
  zone_name           = trimprefix(each.value.fqdn, "${each.value.name}.")
  resource_group_name = "cgnonboardingportal-${var.env_short}-vnet-rg"
  ttl                 = each.value.ttl
  records             = each.value.ip_addresses
}