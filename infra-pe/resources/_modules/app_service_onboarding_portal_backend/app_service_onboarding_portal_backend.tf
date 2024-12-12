module "app_service_onboarding_portal_backend" {
  source = "github.com/pagopa/dx//infra/modules/azure_app_service?ref=main"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "onboarding-portal-backend"
    instance_number = "01"
  }

  resource_group_name = var.resource_group_name
  health_check_path   = "/actuator/health"

  tier = var.onboarding_portal_backend_tier

  # SETTINGS
  app_settings      = merge(local.onboarding_portal_backend.app_settings, local.onboarding_portal_backend.production_slot_settings)
  slot_app_settings = merge(local.onboarding_portal_backend.app_settings, local.onboarding_portal_backend.staging_slot_settings)

  sticky_app_setting_names = [
    "EYCA_EXPORT_ENABLED",
    "SPRING_QUARTZ_AUTOSTARTUP",
    "APPINSIGHTS_INSTRUMENTATIONKEY",
    "APPINSIGHTS_PROFILERFEATURE_VERSION",
    "APPINSIGHTS_SNAPSHOTFEATURE_VERSION",
    "APPLICATIONINSIGHTS_CONFIGURATION_CONTENT",
    "ApplicationInsightsAgent_EXTENSION_VERSION",
    "DiagnosticServices_EXTENSION_VERSION",
    "InstrumentationEngine_EXTENSION_VERSION",
    "SnapshotDebugger_EXTENSION_VERSION",
    "XDT_MicrosoftApplicationInsights_BaseExtensions",
    "XDT_MicrosoftApplicationInsights_Mode",
    "XDT_MicrosoftApplicationInsights_PreemptSdk",
  ]

  # SUBNET
  subnet_cidr                          = var.cidr_subnet_cgn_onboarding_portal_backend
  subnet_pep_id                        = var.private_endpoint_subnet_id
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name

  # APP INSIGHTS
  application_insights_connection_string   = var.ai_connection_string
  application_insights_sampling_percentage = var.ai_sampling_percentage

  virtual_network = {
    name                = var.virtual_network.name
    resource_group_name = var.virtual_network.resource_group_name
  }

  tags = var.tags

}
