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

variable "domain" {
  type        = string
  description = "Domain"
}

variable "repository" {
  type        = string
  description = "Name of the repository"
}

variable "app_cd_reviewers_teams" {
  type        = list(string)
  description = "List of teams that should review the job execution"
  default     = ["io-cgn-contributors", "engineering-team-cloud-eng"]
}
