variable "resource_group_name" {
  type        = string
  description = "Resource group name"
}

variable "tags" {
  type        = map(any)
  description = "Resources tags"
}

variable "virtual_network" {
  type = object({
    id   = string
    name = string
  })
  description = "Virtual network where to attach private dns zones"
}

variable "private_dns_zones" {
  type        = map(any)
  description = "Private DNS zones"
  default = {
    "redis"                    = "privatelink.redis.cache.windows.net"
    "psql"                     = "privatelink.postgres.database.azure.com"
    "servicebus"               = "privatelink.servicebus.windows.net"
    "documents"                = "privatelink.documents.azure.com"
    "blob"                     = "privatelink.blob.core.windows.net"
    "file"                     = "privatelink.file.core.windows.net"
    "queue"                    = "privatelink.queue.core.windows.net"
    "table"                    = "privatelink.table.core.windows.net"
    "azurewebsites"            = "privatelink.azurewebsites.net"
    "srch"                     = "privatelink.search.windows.net"
    "vault"                    = "privatelink.vaultcore.azure.net"
    "azure_api_net"            = "azure-api.net"
    "management_azure_api_net" = "management.azure-api.net"
    "scm_azure_api_net"        = "scm.azure-api.net"
  }
}

variable "override_link_names" {
  type        = map(string)
  description = "Override link names"
  default     = {}
}