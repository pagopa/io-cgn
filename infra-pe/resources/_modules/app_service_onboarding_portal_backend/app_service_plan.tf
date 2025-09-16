resource "azurerm_service_plan" "app_service_plan_onboarding_portal_backend" {  
  name                   = "${var.project}-${var.domain}-backend-asp-01"
  location               = var.location
  resource_group_name    = var.resource_group_name
  os_type                = "Linux"
  sku_name               = local.sku_name_mapping[var.onboarding_portal_backend_tier]
  zone_balancing_enabled = false

  tags = var.tags
}
