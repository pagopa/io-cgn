locals {
  repository = "io-cgn"
  env_short  = "p"
  env        = "prod"
  domain     = "io-cgn"
  project    = "${local.domain}-${local.env_short}"

  identity_resource_group_name = "${local.project}-identity-rg"
}
