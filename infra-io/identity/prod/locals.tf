locals {
  prefix    = "io"
  env_short = "p"
  env       = "prod"
  location  = "italynorth"
  project   = "${local.prefix}-${local.env_short}"
  domain    = "cgn"

  repo_name = "io-cgn"

  tags = {
    CostCenter   = "TS000 - Tecnologia e Servizi"
    CreatedBy    = "Terraform"
    Environment  = "Prod"
    BusinessUnit = "CGN"
    Source       = "https://github.com/pagopa/io-cgn/blob/main/infra-io/identity/prod"
  }

  environment_cd_roles = {
    subscription = [
      "Reader",
      "Reader and Data Access",
      "PagoPA IaC Reader",
      "Role Based Access Control Administrator",
    ]
    resource_groups = {
      terraform-state-rg = [
        "Storage Blob Data Contributor"
      ],
      io-p-itn-cgn-rg-01 = [
        "Contributor",
        "User Access Administrator",
        "Key Vault Secrets Officer",
        "Key Vault Certificates Officer",
        "Key Vault Crypto Officer",
        "Storage Blob Data Contributor",
        "Storage Queue Data Contributor",
        "Storage Table Data Contributor",
      ],
      io-p-itn-common-rg-01 = [
        "Network Contributor",
        "API Management Service Contributor",
      ]
      io-p-rg-common = [
        "Private DNS Zone Contributor"
      ],
    }
  }

  environment_ci_roles = {
    subscription = [
      "Reader",
      "Reader and Data Access",
      "PagoPA IaC Reader",
      "DocumentDB Account Contributor"
    ]
    resource_groups = {
      terraform-state-rg = [
        "Storage Blob Data Contributor"
      ],
      io-p-itn-cgn-rg-01 = [
        "Key Vault Secrets User",
        "Key Vault Certificate User",
        "Key Vault Crypto User",
        "Storage Blob Data Reader",
        "Storage Queue Data Reader",
        "Storage Table Data Reader",
      ],
    }
  }

  issuer   = "https://token.actions.githubusercontent.com"
  audience = ["api://AzureADTokenExchange"]
}
