locals {
  prefix    = "io"
  env_short = "p"
  env       = "prod"
  location  = "westeurope"
  project   = "${local.prefix}-${local.env_short}"
  domain    = "cgn"

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
      io-p-itn-cgn-rg-01 = [
        "Role Based Access Control Administrator",
        "Key Vault Reader",
        "Key Vault Crypto User",
        "Key Vault Secrets User",
      ],
      io-p-rg-operations = [
        "Role Based Access Control Administrator"
      ]
    }
  }
}
