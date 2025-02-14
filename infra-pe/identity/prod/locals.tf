locals {
  prefix    = "io"
  env_short = "p"
  env       = "prod"
  location  = "italynorth"
  project   = "${local.prefix}-${local.env_short}"
  domain    = "pe-cgn"

  repo_name = "io-cgn"

  tags = {
    CostCenter  = "TS310 - PAGAMENTI & SERVIZI"
    CreatedBy   = "Terraform"
    Environment = "Prod"
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
      ],
      io-p-itn-cgn-pe-rg-01 = [
        "Key Vault Administrator",
        "Owner"
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
      ],
      io-p-itn-cgn-pe-rg-01 = [
        "Key Vault Secrets User"
      ]
    }
  }
}
