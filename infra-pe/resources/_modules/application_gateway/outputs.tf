output "agw" {
  value = {
    ip_address = resource.azurerm_public_ip.app_gw_public_ip.ip_address
  }
}
