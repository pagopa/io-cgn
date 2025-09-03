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
  description = "Resource domain"
}

variable "app_name" {
  type        = string
  description = "Application name"
}

variable "instance_number" {
  type        = string
  description = "Instance number"
}

variable "tags" {
  type        = map(any)
  description = "Resource tags"
}

variable "resource_group_name" {
  type        = string
  description = "Name of the resource group where resources will be created"
}

variable "custom_domain" {
  type        = string
  description = "Custom domain for the CDN"
}

variable "zone_name" {
  type        = string
  description = "DNS zone name for the custom domain"
}

variable "zone_resource_group_name" {
  type        = string
  description = "Resource group name where the DNS zone is located"
}
