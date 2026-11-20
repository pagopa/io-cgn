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

variable "cae_use_case" {
  type        = string
  description = "Use case of the DX Container App Environment (default or development)"
  default     = "default"

  validation {
    condition     = contains(["default", "development"], var.cae_use_case)
    error_message = "cae_use_case must be either 'default' or 'development'."
  }
}
