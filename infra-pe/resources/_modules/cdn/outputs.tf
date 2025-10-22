output "cdn" {
  value = {
    id                = module.cgn_pe_cdn.id
    name              = module.cgn_pe_cdn.name
    endpoint_id       = module.cgn_pe_cdn.endpoint_id
    endpoint_hostname = module.cgn_pe_cdn.endpoint_hostname
  }
}
