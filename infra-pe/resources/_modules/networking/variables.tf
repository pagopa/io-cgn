variable "project" {
  type        = string
  description = "IO prefix, short environment and short location"
}

variable "domain" {
  type        = string
  description = "Domain"
}

variable "location" {
  type        = string
  description = "Azure region"
}

variable "location_short" {
  type        = string
  description = "Azure region short name"
}

variable "env_short" {
  type        = string
  description = "Short environment name"
}

variable "tags" {
  type        = map(any)
  description = "Resource tags"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name for VNet"
}

variable "vnet_cidr_block" {
  type        = string
  description = "CIDR block allocated in the common vnet"
}

variable "pep_snet_cidr" {
  type        = list(string)
  description = "CIDR block allocated in the private endpoints subnet"
}

variable "ddos_protection_enabled" {
  type        = bool
  description = "Enable DDoS protection"
  default     = true
}