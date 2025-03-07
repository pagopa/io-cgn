variable "tags" {
  type        = map(any)
  description = "Resource tags"
}

variable "autoscale_name" {
  type        = string
  description = "Name of the autoscale settings"
  default     = null
}

variable "resource_group_name" {
  type        = string
  description = "Name of the resource group where resources will be created"
}

variable "function_app_name" {
  type        = string
  description = "Name of the function app to autoscale"
}

variable "app_service_plan_id" {
  type        = string
  description = "The id of the app service plan containing the service to autoscale."
}

variable "location" {
  type        = string
  description = "The location of the app service plan"
}