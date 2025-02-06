variable "tags" {
  type        = map(any)
  description = "Resource tags"
}

variable "resource_group_name" {
  type        = string
  description = "Name of the resource group where resources will be created"
}

variable "function_app_name" {
  type        = string
  description = "Name of the function app to autoscale"
}