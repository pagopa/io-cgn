output "apim" {
  value = {
    id               = module.apim.id
    name             = module.apim.name
    gateway_url      = module.apim.gateway_url
    gateway_hostname = module.apim.gateway_hostname
  }
}
