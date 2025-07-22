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

variable "app_name" {
  type        = string
  description = "App name"
}

variable "instance_number" {
  type        = string
  description = "The istance number to create"
}

variable "tags" {
  type        = map(any)
  description = "Resource tags"
}

variable "resource_group_name" {
  type        = string
  description = "Name of the resource group where resources will be created"
}

variable "subnet_pep_id" {
  type = string
}

variable "action_group_id" {
  type        = string
  description = "The action group id for alerts"
  sensitive   = true
}