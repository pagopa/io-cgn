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

variable "cidr_subnet_cgn_card_func" {
  type        = string
  description = "CIDR block for cgn card function app subnet"
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
  type        = string
  description = "The connection string to connect to application insights"
}

variable "ai_sampling_percentage" {
  type        = string
  description = "The sampling percentage for application insights"
}

# REPO DEFINED VARIABLES

variable "redis_url" {
  type        = string
  description = "Redis url"
}

variable "redis_port" {
  type        = string
  description = "Redis port"
}

variable "redis_password" {
  type        = string
  description = "Redis password"
}

variable "cosmosdb_cgn_uri" {
  type        = string
  description = "Connection uri for CGN cosmosdb"
}

variable "cosmosdb_cgn_key" {
  type        = string
  description = "Connection key for CGN cosmosdb"
}

variable "cosmosdb_cgn_database_name" {
  type        = string
  description = "Database name for CGN cosmosdb"
}

variable "storage_cgn_connection_string" {
  type        = string
  description = "CGN storage connection key"
}

variable "table_cgn_expiration" {
  type        = string
  description = "CGN expiration table name"
}

variable "table_eyca_expiration" {
  type        = string
  description = "EYCA expiration table name"
}

variable "pending_cgn_queue_name" {
  type        = string
  description = "Pending CGN queue name"
}

variable "pending_eyca_queue_name" {
  type        = string
  description = "Pending EYCA queue name"
}

variable "activated_cgn_queue_name" {
  type        = string
  description = "Activated CGN queue name"
}

variable "activated_eyca_queue_name" {
  type        = string
  description = "Activated EYCA queue name"
}

variable "eyca_api_base_url" {
  type        = string
  description = "EYCA API base url"
}

variable "eyca_api_username" {
  type        = string
  description = "EYCA API username"
}

variable "eyca_api_password" {
  type        = string
  description = "EYCA API password"
}

variable "services_api_url" {
  type        = string
  description = "Services API url"
}

variable "services_api_key" {
  type        = string
  description = "Services API key"
}

variable "cgn_service_id" {
  type        = string
  description = "CGN service id"
}

variable "cgn_legal_backup_storage_connection" {
  type        = string
  description = "Legal backup storage connection string"
}

variable "cgn_legal_backup_container_name" {
  type        = string
  description = "Legal backup container name"
}

variable "cgn_legal_backup_folder_name" {
  type        = string
  description = "Legal backup folder name"
}

variable "otp_ttl_in_seconds" {
  type        = string
  description = "OTP TTL in seconds for API integrated merchants"
}

variable "cgn_upper_bound_age" {
  type        = string
  description = "CGN upper bound age"
}

variable "eyca_upper_bound_age" {
  type        = string
  description = "EYCA upper bound age"
}
