variable "prefix" {
  type        = string
  description = "IO Prefix"
}

variable "env_short" {
  type        = string
  description = "Short environment"
}

variable "project" {
  type        = string
  description = "IO prefix and short environment"
}

variable "location" {
  type        = string
  description = "Azure region"
}

variable "domain" {
  type        = string
  description = "Domain"
}

variable "tags" {
  type        = map(any)
  description = "Resource tags"
}

variable "resource_group_name" {
  type        = string
  description = "Name of the resource group where resources will be created"
}

variable "cidr_subnet_cgn_onboarding_portal_backend" {
  type        = string
  description = "CIDR block for onboarding portal backend app service subnet"
}

variable "private_endpoint_subnet_id" {
  type        = string
  description = "Private Endpoints subnet Id"
}

variable "virtual_network" {
  type = object({
    name                = string
    resource_group_name = string
  })
  description = "Virtual network to create subnet in"
}

variable "private_dns_zone_resource_group_name" {
  type        = string
  description = "Resource group name of the private DNS zone to use for private endpoints"
}

variable "ai_instrumentation_key" {
  type        = string
  description = "The key to connect to application insights"
}

variable "ai_connection_string" {
  sensitive   = true
  type        = string
  description = "The connection string to connect to application insights"
}

variable "ai_sampling_percentage" {
  type        = string
  description = "The sampling percentage for application insights"
}

# REPO DEFINED VARIABLES
variable "appinsights_instrumentationkey" {
  type        = string
  description = "Application insights instrumentation key"
  sensitive   = true
}

variable "onboarding_portal_backend_tier" {
  type        = string
  description = "The tier for onboarding portal backend app service"
}

variable "docker_registry_server_url" {
  type        = string
  description = "Docker container registry url"
  sensitive   = true
}

variable "docker_registry_server_username" {
  type        = string
  description = "Docker container registry username"
  sensitive   = true
}

variable "docker_registry_server_password" {
  type        = string
  description = "Docker container registry password"
  sensitive   = true
}

variable "spring_datasource_url" {
  type        = string
  description = "Spring datasource url"
  sensitive   = true
}

variable "spring_datasource_username" {
  type        = string
  description = "Spring datasource username"
  sensitive   = true
}

variable "spring_datasource_password" {
  type        = string
  description = "Spring datasource password"
  sensitive   = true
}

variable "cgn_pe_storage_azure_account_name" {
  type        = string
  description = "Storage account name"
  sensitive   = true
}

variable "cgn_pe_storage_azure_account_key" {
  type        = string
  description = "Storage account key"
  sensitive   = true
}

variable "cgn_pe_storage_azure_blob_endpoint" {
  type        = string
  description = "Storage account blob endpoint"
  sensitive   = true
}

variable "spring_mail_host" {
  type        = string
  description = "Mailer host"
  sensitive   = true
}

variable "spring_mail_port" {
  type        = string
  description = "Mailer port"
  sensitive   = true
}

variable "spring_mail_username" {
  type        = string
  description = "Mailer username"
  sensitive   = true
}

variable "spring_mail_password" {
  type        = string
  description = "Mailer password"
  sensitive   = true
}

variable "cgn_email_department_email" {
  type        = string
  description = "Department email address"
  sensitive   = true
}

variable "cgn_email_portal_base_url" {
  type        = string
  description = "Redirect url inside email"
  sensitive   = true
}

variable "eyca_export_enabled" {
  type        = bool
  description = "Is eyca export enabled?"
}

variable "eyca_export_username" {
  type        = string
  description = "CCDB username"
  sensitive   = true
}

variable "eyca_export_password" {
  type        = string
  description = "CCDB password"
  sensitive   = true
}

variable "cgn_apim_resourcegroup" {
  type        = string
  description = "CGN APIM resource group name"
  sensitive   = true
}

variable "cgn_apim_resource" {
  type        = string
  description = "CGN APIM resource name"
  sensitive   = true
}

variable "cgn_apim_productid" {
  type        = string
  description = "CGN APIM product id"
  sensitive   = true
}

variable "azure_subscription_id" {
  type        = string
  description = "APIM subscription id"
  sensitive   = true
}

variable "cgn_recaptcha_secret_key" {
  type        = string
  description = "Recaptcha secret key"
  sensitive   = true
}

variable "cgn_geolocation_secret_token" {
  type        = string
  description = "Geolocation secret token"
  sensitive   = true
}

variable "cgn_attribute_authority_base_url" {
  type        = string
  description = "Attribute Authority base url"
  sensitive   = true
}

variable "spring_quartz_autostartup" {
  type        = bool
  description = "Is quartz scheduled enabled?"
}

variable "cgn_portal_base_url" {
  type        = string
  description = "CGN portal base url"
}

variable "one_identity_base_url" {
  type        = string
  description = "One Identity server base url"
}

variable "one_identity_id" {
  type        = string
  description = "One Identity client id"
}

variable "one_identity_secret" {
  type        = string
  description = "One Identity client secret"
}

variable "one_identity_well_known" {
  type        = string
  description = "One Identity .well-known url"
}

variable "active_directory_id" {
  type        = string
  description = "Active Directory client id"
}

variable "active_directory_well_known" {
  type        = string
  description = "Active Directory .well-known url"
}

variable "jwt_private_key" {
  type        = string
  description = "Private key to sign JWT"
}

variable "jwt_public_key" {
  type        = string
  description = "Public key to verify JWT signature"
}
