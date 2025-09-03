locals {
  assets_naming_config = {
    prefix          = var.prefix,
    environment     = var.env_short,
    location        = var.location
    domain          = var.domain,
    name            = format("%s-assets", var.app_name),
    instance_number = tonumber(var.instance_number),
  }
}
