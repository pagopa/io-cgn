locals {
  # environment object required by pagopa-dx modules (e.g. azure-storage-account).
  # Composed from individual vars so existing resources keep their
  # ${var.project}-${var.domain} naming unchanged.
  storage_environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    domain          = var.domain
    app_name        = "adf"
    instance_number = "01"
  }
}
