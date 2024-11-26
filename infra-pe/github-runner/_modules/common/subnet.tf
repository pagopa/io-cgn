module "subnet_runner" {
  source = "github.com/pagopa/terraform-azurerm-v3.git//subnet?ref=v8.50.0"

  name                 = "${local.project}-github-runner-snet"
  resource_group_name  = "cgnonboardingportal-${var.env_short}-vnet-rg"
  virtual_network_name = "cgnonboardingportal-${var.env_short}-vnet"

  address_prefixes = [
    "10.0.200.0/23"
  ]

  service_endpoints = [
    "Microsoft.Web"
  ]

  private_endpoint_network_policies_enabled = true
}
