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

variable "instance_number" {
  type        = string
  description = "The istance number to create"
}

variable "app_service_plan_id" {
  type        = string
  description = "The app service plan where you want to host the functions"
  default     = null
}

variable "tags" {
  type        = map(any)
  description = "Resource tags"
}

variable "resource_group_name" {
  type        = string
  description = "Name of the resource group where resources will be created"
}

variable "subnet_id" {
  type        = string
  description = "A predefined subnet id"
  default     = null
}

variable "cidr_subnet_cgn_support_func" {
  type        = string
  description = "CIDR block for cgn support function app subnet"
  default     = null
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