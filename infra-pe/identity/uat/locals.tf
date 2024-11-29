locals {
  prefix    = "io"
  env_short = "u"
  env       = "uat"
  location  = "italynorth"
  project   = "${local.prefix}-${local.env_short}"
  domain    = "pe-cgn"

  repo_name = "io-cgn"

  tags = {
    CostCenter  = "TS310 - PAGAMENTI & SERVIZI"
    CreatedBy   = "Terraform"
    Environment = "Uat"
    Owner       = "IO CGN"
    Source      = "https://github.com/pagopa/io-cgn/blob/main/infra/identity/prod"
  }

  environment_cd_roles = {
    subscription = [
      "Contributor"
    ]
    resource_groups = {
      terraform-state-rg = [
        "Storage Blob Data Contributor"
      ]
    }
  }
  environment_ci_roles = {
    subscription = [
      "Reader",
      "Reader and Data Access",
      "PagoPA IaC Reader"
    ]
    resource_groups = {
      terraform-state-rg = [
        "Storage Blob Data Contributor"
      ]
    }
  }
}
