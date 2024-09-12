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

variable "cidr_subnet_cgn_search_func" {
  type        = string
  description = "CIDR block for cgn search function app subnet"
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

variable "cgn_postgres_db_admin_connection_string" {
  type        = string
  description = "Postgres admin connection string"
}

variable "cgn_cdn_endpoint_base_url" {
  type        = string
  description = "CDN endpoint base url"
}