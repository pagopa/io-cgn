module "cgn_pe_apim" {
  source = "./infra/modules/azure_api_management"

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
  tier                = "s"

  publisher_email = "email@example.com"
  publisher_name  = "Example Publisher"

  virtual_network = {
    name                = var.virtual_network.name
    resource_group_name = var.virtual_network.resource_group_name
  }
  subnet_id                     = resource.azurerm_subnet.cgn_pe_apim_subnet.id
  virtual_network_type_internal = true
}
