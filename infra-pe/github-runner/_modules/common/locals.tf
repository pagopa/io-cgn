locals {
  project  = "${var.prefix}-${var.env_short}-${var.domain}"
  location = { weu = "westeurope", itn = "italynorth" }

  cae_environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = local.location.itn
    domain          = var.domain
    app_name        = "github-runner"
    instance_number = "02"
  }

  cae_use_cases = {
    default = {
      zone_redundancy_enabled = true
      lock_enabled            = true
      subnet_prefix_length    = 23
    }
    development = {
      zone_redundancy_enabled = false
      lock_enabled            = false
      subnet_prefix_length    = 27
    }
  }

  cae_use_case = local.cae_use_cases[var.cae_use_case]
}
