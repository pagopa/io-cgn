data "azuread_application" "vpn_app" {
  display_name = "cgnonboardingportal-${var.env_short}-app-vpn"
}
