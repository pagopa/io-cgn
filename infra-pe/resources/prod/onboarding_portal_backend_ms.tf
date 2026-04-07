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

  cidr_subnet_cgn_onboarding_portal_backend = "10.26.1.0/26"
  private_endpoint_subnet_id                = module.networking.pep_snet.id
  private_dns_zone_resource_group_name      = azurerm_resource_group.itn_cgn_pe.name

  virtual_network = {
    resource_group_name = module.networking.vnet_common.resource_group_name
    name                = module.networking.vnet_common.name
  }

  appinsights_instrumentationkey     = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=appinsights-instrumentationkey)"
  docker_registry_server_url         = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=docker-registry-server-url)"
  docker_registry_server_username    = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=docker-registry-server-username)"
  docker_registry_server_password    = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=docker-registry-server-password)"
  environment                        = "prod"
  spring_datasource_url              = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=spring-datasource-url)"
  spring_datasource_username         = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=spring-datasource-username)"
  spring_datasource_password         = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=spring-datasource-password)"
  cgn_pe_storage_azure_account_name  = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-pe-storage-azure-account-name)"
  cgn_pe_storage_azure_account_key   = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-pe-storage-azure-account-key)"
  cgn_pe_storage_azure_blob_endpoint = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-pe-storage-azure-blob-endpoint)"
  spring_mail_host                   = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=spring-mail-host)"
  spring_mail_port                   = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=spring-mail-port)"
  spring_mail_username               = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=spring-mail-username)"
  spring_mail_password               = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=spring-mail-password)"
  cgn_email_department_email         = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-email-department-email)"
  cgn_email_portal_base_url          = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-email-portal-base-url)"
  eyca_export_enabled                = true
  eyca_export_username               = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=eyca-export-username)"
  eyca_export_password               = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=eyca-export-password)"
  cgn_apim_resourcegroup             = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-apim-resourcegroup)"
  cgn_apim_resource                  = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-apim-resource)"
  cgn_apim_productid                 = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-apim-productid)"
  azure_subscription_id              = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=azure-subscription-id)"
  cgn_recaptcha_secret_key           = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-recaptcha-secret-key)"
  cgn_geolocation_secret_token       = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-geolocation-secret-token)"
  spring_quartz_autostartup          = true
  cgn_portal_base_url                = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-portal-base-url)"
  one_identity_base_url              = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-one-identity-base-url)"
  one_identity_id                    = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-one-identity-id)"
  one_identity_secret                = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-one-identity-secret)"
  one_identity_well_known            = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-one-identity-well-known)"
  active_directory_id                = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-active-directory-id)"
  active_directory_well_known        = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-active-directory-well-known)"
  jwt_private_key                    = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-jwt-private-key)"
  jwt_public_key                     = "@Microsoft.KeyVault(VaultName=${module.key_vaults.key_vault_cgn_pe.name};SecretName=cgn-jwt-public-key)"

  tags = local.tags

  depends_on = [module.networking, module.dns]
}
