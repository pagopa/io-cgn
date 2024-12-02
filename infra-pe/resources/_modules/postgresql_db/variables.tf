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

variable "private_endpoint_subnet_id" {
  type        = string
  description = "Private Endpoints subnet Id"
}

variable "private_dns_zone_resource_group_name" {
  type        = string
  description = "Resource group name of the private DNS zone to use for private endpoints"
}

variable "db_username" {
  type        = string
  description = "DB admin username"
  sensitive   = true
}

variable "db_password" {
  type        = string
  description = "DB admin password"
  sensitive   = true
}

variable "tier" {
  type        = string
  description = "DB tier"
}

variable "db_version" {
  type        = number
  description = "DB version"
}

variable "storage_mb" {
  type        = number
  description = "DB storage size in mb"
}

variable "backup_retention_days" {
  type        = number
  description = "How many days to keep backups"
}

variable "pgbouncer_enabled" {
  type        = bool
  description = "Enable PG bouncer?"
}
