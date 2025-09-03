module "apim" {
  source  = "pagopa-dx/azure-api-management/azurerm"
  version = "~> 1.0"

  tags = var.tags

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "apim"
    instance_number = "01"
  }

  resource_group_name = var.resource_group_name
  tier                = var.tier

  publisher_email = "io-operations@pagopa.it"
  publisher_name  = "PagoPa CGN Onboarding Portal"

  virtual_network = {
    name                = var.virtual_network.name
    resource_group_name = var.virtual_network.resource_group_name
  }
  subnet_id                     = resource.azurerm_subnet.cgn_pe_apim_subnet.id
  virtual_network_type_internal = true
}
