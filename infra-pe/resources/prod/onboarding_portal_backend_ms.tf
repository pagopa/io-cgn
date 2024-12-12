data "azurerm_key_vault_secret" "appinsights_instrumentationkey" {
  name         = "appinsights-instrumentationkey"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "docker_registry_server_url" {
  name         = "docker-registry-server-url"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "docker_registry_server_username" {
  name         = "docker-registry-server-username"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "docker_registry_server_password" {
  name         = "docker-registry-server-password"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "spring_datasource_url" {
  name         = "spring-datasource-url"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "spring_datasource_username" {
  name         = "spring-datasource-username"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "spring_datasource_password" {
  name         = "spring-datasource-password"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "cgn_pe_storage_azure_account_name" {
  name         = "cgn-pe-storage-azure-account-name"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "cgn_pe_storage_azure_account_key" {
  name         = "cgn-pe-storage-azure-account-key"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "cgn_pe_storage_azure_blob_endpoint" {
  name         = "cgn-pe-storage-azure-blob-endpoint"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "spring_mail_host" {
  name         = "spring-mail-host"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "spring_mail_port" {
  name         = "spring-mail-port"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "spring_mail_username" {
  name         = "spring-mail-username"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "spring_mail_password" {
  name         = "spring-mail-password"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "cgn_email_department_email" {
  name         = "cgn-email-department-email"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "cgn_email_portal_base_url" {
  name         = "cgn-email-portal-base-url"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "eyca_export_username" {
  name         = "eyca-export-username"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "eyca_export_password" {
  name         = "eyca-export-password"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "cgn_apim_resourcegroup" {
  name         = "cgn-apim-resourcegroup"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "cgn_apim_resource" {
  name         = "cgn-apim-resource"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "cgn_apim_productid" {
  name         = "cgn-apim-productid"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "azure_subscription_id" {
  name         = "azure-subscription-id"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "cgn_recaptcha_secret_key" {
  name         = "cgn-recaptcha-secret-key"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "cgn_geolocation_secret_token" {
  name         = "cgn-geolocation-secret-token"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

data "azurerm_key_vault_secret" "cgn_attribute_authority_base_url" {
  name         = "cgn-attribute-authority-base-url"
  key_vault_id = module.key_vaults.key_vault_cgn_pe.id
}

module "app_service_onboarding_portal_backend" {
  source = "../_modules/app_service_onboarding_portal_backend"

  prefix    = local.prefix
  env_short = local.env_short
  location  = local.location
  project   = local.project
  domain    = local.domain

  resource_group_name = azurerm_resource_group.itn_cgn_pe.name

  onboarding_portal_backend_tier = "m"

  ai_instrumentation_key = data.azurerm_application_insights.ai_cgn_pe.instrumentation_key
  ai_connection_string   = data.azurerm_application_insights.ai_cgn_pe.connection_string
  ai_sampling_percentage = 100

  cidr_subnet_cgn_onboarding_portal_backend = "10.25.1.0/26"
  private_endpoint_subnet_id                = module.networking.pep_snet.id
  private_dns_zone_resource_group_name      = azurerm_resource_group.itn_cgn_pe.name

  virtual_network = {
    resource_group_name = module.networking.vnet_common.resource_group_name
    name                = module.networking.vnet_common.name
  }

  appinsights_instrumentationkey     = data.azurerm_key_vault_secret.appinsights_instrumentationkey.value
  docker_registry_server_url         = data.azurerm_key_vault_secret.docker_registry_server_url.value
  docker_registry_server_username    = data.azurerm_key_vault_secret.docker_registry_server_username.value
  docker_registry_server_password    = data.azurerm_key_vault_secret.docker_registry_server_password.value
  spring_datasource_url              = data.azurerm_key_vault_secret.spring_datasource_url.value
  spring_datasource_username         = data.azurerm_key_vault_secret.spring_datasource_username.value
  spring_datasource_password         = data.azurerm_key_vault_secret.spring_datasource_password.value
  cgn_pe_storage_azure_account_name  = data.azurerm_key_vault_secret.cgn_pe_storage_azure_account_name.value
  cgn_pe_storage_azure_account_key   = data.azurerm_key_vault_secret.cgn_pe_storage_azure_account_key.value
  cgn_pe_storage_azure_blob_endpoint = data.azurerm_key_vault_secret.cgn_pe_storage_azure_blob_endpoint.value
  spring_mail_host                   = data.azurerm_key_vault_secret.spring_mail_host.value
  spring_mail_port                   = data.azurerm_key_vault_secret.spring_mail_port.value
  spring_mail_username               = data.azurerm_key_vault_secret.spring_mail_username.value
  spring_mail_password               = data.azurerm_key_vault_secret.spring_mail_password.value
  cgn_email_department_email         = data.azurerm_key_vault_secret.cgn_email_department_email.value
  cgn_email_portal_base_url          = data.azurerm_key_vault_secret.cgn_email_portal_base_url.value
  eyca_export_enabled                = true
  eyca_export_username               = data.azurerm_key_vault_secret.eyca_export_username.value
  eyca_export_password               = data.azurerm_key_vault_secret.eyca_export_password.value
  cgn_apim_resourcegroup             = data.azurerm_key_vault_secret.cgn_apim_resourcegroup.value
  cgn_apim_resource                  = data.azurerm_key_vault_secret.cgn_apim_resource.value
  cgn_apim_productid                 = data.azurerm_key_vault_secret.cgn_apim_productid.value
  azure_subscription_id              = data.azurerm_key_vault_secret.azure_subscription_id.value
  cgn_recaptcha_secret_key           = data.azurerm_key_vault_secret.cgn_recaptcha_secret_key.value
  cgn_geolocation_secret_token       = data.azurerm_key_vault_secret.cgn_geolocation_secret_token.value
  cgn_attribute_authority_base_url   = data.azurerm_key_vault_secret.cgn_attribute_authority_base_url.value
  spring_quartz_autostartup          = true

  tags = local.tags

  depends_on = [module.networking, module.dns]
}
