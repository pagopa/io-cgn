variable "prefix" {
  type        = string
  description = "IO Prefix"
  default     = "io"
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