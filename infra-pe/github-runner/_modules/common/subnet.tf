resource "azurerm_subnet" "subnet_runner" {
  name                 = "${local.project}-github-runner-snet"
  resource_group_name  = var.vnet.resource_group_name
  virtual_network_name = var.vnet.name

  address_prefixes = [
    var.snet.cidr
  ]

  service_endpoints = [
    "Microsoft.Web"
  ]

  private_endpoint_network_policies = "Enabled"
}

moved {
  from = module.subnet_runner.azurerm_subnet.this
  to   = azurerm_subnet.subnet_runner
}
