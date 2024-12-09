variable "prefix" {
  type        = string
  description = "IO Prefix"
  default     = "io"
}

variable "domain" {
  type        = string
  description = "Domain name"
}

variable "env" {
  type        = string
  description = "Environment"
}

variable "env_short" {
  type        = string
  description = "Short environment"
}

variable "repository" {
  type        = string
  description = "Name of the repository"
}

variable "tags" {
  type        = map(any)
  description = "Tags for the resources"
}

variable "vnet" {
  type = object({
    name                = string
    resource_group_name = string
  })

  description = "Virtual Network configuration"
}

variable "snet" {
  type = object({
    cidr = string
  })

  description = "Subnet configuration"
}