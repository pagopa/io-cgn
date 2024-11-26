locals {
  prefix    = "io"
  env_short = "u"
  env       = "uat"
  repo_name = "io-cgn"
  project   = "${local.prefix}-${local.env_short}"
  location  = { weu = "westeurope", itn = "italynorth" }

  tags = {
    CostCenter  = "TS310 - PAGAMENTI & SERVIZI"
    CreatedBy   = "Terraform"
    Environment = "Uat"
    Owner       = "IO CGN"
    Source      = "https://github.com/pagopa/io-cgn/blob/main/infra-pe/github-runner/uat"
  }
}
