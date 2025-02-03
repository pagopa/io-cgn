## VPN

module "vpn_snet" {
  source                            = "github.com/pagopa/terraform-azurerm-v4//subnet?ref=v1.1.0"
  name                              = "GatewaySubnet"
  address_prefixes                  = var.vpn_cidr_subnet
  resource_group_name               = var.resource_group_name
  virtual_network_name              = var.virtual_network.name
  service_endpoints                 = []
  private_endpoint_network_policies = "Disabled"
}

module "vpn" {
  source = "github.com/pagopa/terraform-azurerm-v4//vpn_gateway?ref=v1.1.0"

  name                  = "${var.project}-vgw-01"
  location              = var.location
  resource_group_name   = var.resource_group_name
  sku                   = var.vpn_sku
  pip_sku               = var.vpn_pip_sku
  subnet_id             = module.vpn_snet.id
  pip_allocation_method = "Static"

  vpn_client_configuration = [
    {
      address_space         = ["172.16.2.0/24"],
      vpn_client_protocols  = ["OpenVPN"],
      aad_audience          = data.azuread_application.vpn_app.client_id
      aad_issuer            = "https://sts.windows.net/${var.subscription_current.tenant_id}/"
      aad_tenant            = "https://login.microsoftonline.com/${var.subscription_current.tenant_id}"
      radius_server_address = null
      radius_server_secret  = null
      revoked_certificate   = []
      root_certificate      = []
    }
  ]

  tags = var.tags
}

## DNS FORWARDER
module "dns_forwarder_snet" {
  source                            = "github.com/pagopa/terraform-azurerm-v4//subnet?ref=v1.1.0"
  name                              = "${var.project}-dns-forwarder-snet-01"
  address_prefixes                  = var.dnsforwarder_cidr_subnet
  resource_group_name               = var.resource_group_name
  virtual_network_name              = var.virtual_network.name
  private_endpoint_network_policies = "Disabled"

  delegation = {
    name = "delegation"
    service_delegation = {
      name    = "Microsoft.ContainerInstance/containerGroups"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

module "dns_forwarder" {
  source              = "github.com/pagopa/terraform-azurerm-v4//dns_forwarder?ref=v1.1.0"
  name                = "${var.project}-dns-forwarder-ci-01"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = module.dns_forwarder_snet.id

  tags = var.tags
}
