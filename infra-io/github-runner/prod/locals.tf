locals {
  prefix    = "io"
  env_short = "p"
  env       = "prod"
  repo_name = "io-cgn"

  tags = {
    CostCenter  = "TS310 - PAGAMENTI & SERVIZI"
    CreatedBy   = "Terraform"
    Environment = "Prod"
    Owner       = "IO CGN"
    Source      = "https://github.com/pagopa/io-cgn/blob/main/infra/github-runner/prod"
  }
}
