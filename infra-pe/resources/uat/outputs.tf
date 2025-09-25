output "uat" {
  value = {
    apim = {
      id               = module.cgn_pe_apim.apim.id
      name             = module.cgn_pe_apim.apim.name
      gateway_url      = module.cgn_pe_apim.apim.gateway_url
      gateway_hostname = module.cgn_pe_apim.apim.gateway_hostname
    }
  }
}
