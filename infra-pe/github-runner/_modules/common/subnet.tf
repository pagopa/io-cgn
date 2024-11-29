module "subnet_runner" {
  source = "github.com/pagopa/terraform-azurerm-v3.git//subnet?ref=v8.50.0"

  name                 = "${local.project}-github-runner-snet"
  resource_group_name  = var.vnet.resource_group_name
  virtual_network_name = var.vnet.name

  address_prefixes = [
    var.snet.cidr
  ]

  service_endpoints = [
    "Microsoft.Web"
  ]

  private_endpoint_network_policies_enabled = true
}
