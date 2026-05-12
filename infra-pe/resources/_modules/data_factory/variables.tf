variable "project" {
  type        = string
  description = "IO prefix and short environment (e.g. io-p-itn)"
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

variable "subscription_id" {
  type        = string
  description = "ID of the current subscription, used for IAM role assignments"
}

variable "private_endpoint_subnet_id" {
  type        = string
  description = "Private Endpoints subnet Id"
}

variable "private_dns_zone_resource_group_name" {
  type        = string
  description = "Resource group that holds private DNS zones; used by the storage account module to register PEP DNS records"
}

variable "private_dns_zone_datafactory_id" {
  type        = string
  description = "Private DNS zone ID for privatelink.datafactory.azure.net"
}

variable "private_dns_zone_adf_portal_id" {
  type        = string
  description = "Private DNS zone ID for privatelink.adf.azure.com"
}

variable "private_dns_zone_cosmosdb_id" {
  type        = string
  description = "Private DNS zone ID for privatelink.documents.azure.com"
}

variable "cosmosdb_io_resource_id" {
  type        = string
  description = "Full resource ID of the CosmosDB account in the PROD-IO subscription"
}

# The two variables below are only used to build the `environment` object
# required by pagopa-dx modules (e.g. azure-storage-account).
# They keep DX naming conventions for new resources without altering
# the ${var.project}-${var.domain} naming used by existing ones.
variable "prefix" {
  type        = string
  description = "IO prefix (e.g. io)"
}

variable "env_short" {
  type        = string
  description = "Short environment identifier (e.g. p)"
}
