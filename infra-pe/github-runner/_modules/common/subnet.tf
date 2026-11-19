resource "dx_available_subnet_cidr" "subnet_runner_02" {
  virtual_network_id = data.azurerm_virtual_network.vnet_pe.id
  prefix_length      = local.cae_use_case.subnet_prefix_length
}

resource "azurerm_subnet" "subnet_runner_02" {
  name                 = provider::dx::resource_name(merge(local.cae_environment, { resource_type = "container_app_subnet" }))
  resource_group_name  = var.vnet.resource_group_name
  virtual_network_name = var.vnet.name

  address_prefixes = [dx_available_subnet_cidr.subnet_runner_02.cidr_block]

  delegation {
    name = "Microsoft.App/environments"

    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}
