locals {
  prefix    = "io"
  env_short = "p"
  env       = "prod"
  repo_name = "io-cgn"

  tags = {
    CostCenter   = "TS000 - Tecnologia e Servizi"
    CreatedBy    = "Terraform"
    Environment  = "Prod"
    BusinessUnit = "CGN"
    Source       = "https://github.com/pagopa/io-cgn/blob/main/infra/github-runner/prod"
  }
}
