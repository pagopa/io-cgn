locals {
  repository = "io-cgn"
  env_short  = "u"
  env        = "uat"
  domain     = "pe-cgn"
  project    = "${local.domain}-${local.env_short}"

  identity_resource_group_name = "${local.project}-identity-rg"
}
