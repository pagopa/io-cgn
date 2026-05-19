terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "<= 3.116.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfinfprodesercenti"
    container_name       = "terraform-state"
    key                  = "io-pe-cgn.identity.prod.tfstate"
  }
}

provider "azurerm" {
  features {
  }
}

provider "azurerm" {
  features {}
  alias           = "io"
  subscription_id = "ec285037-c673-4f58-b594-d7c480da4e8b"
}

module "federated_identities" {
  source = "github.com/pagopa/dx//infra/modules/azure_federated_identity_with_github?ref=main"

  prefix    = local.prefix
  env_short = local.env_short
  env       = "pe-${local.env}"
  domain    = local.domain

  repositories = [local.repo_name]

  continuos_delivery = {
    enable = true,
    roles  = local.environment_cd_roles
  }

  continuos_integration = {
    enable = true,
    roles  = local.environment_ci_roles
  }

  tags = local.tags
}

module "app_federated_identities" {
  source = "github.com/pagopa/dx//infra/modules/azure_federated_identity_with_github?ref=main"

  prefix       = local.prefix
  env_short    = local.env_short
  env          = "pe-app-${local.env}"
  domain       = "${local.domain}-app"
  repositories = [local.repo_name]
  tags         = local.tags

  continuos_integration = { enable = false }
  continuos_delivery = {
    enable = true,
    roles  = local.environment_app_cd_roles
  }
}

# CI needs Reader to initialize the azurerm.io provider and read data sources
resource "azurerm_role_assignment" "ci_reader_io_subscription" {
  provider             = azurerm.io
  scope                = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b"
  role_definition_name = "Reader"
  principal_id         = data.azurerm_user_assigned_identity.ci.principal_id
}

# CD needs Reader + RBAC admin to create role assignments on the CosmosDB
resource "azurerm_role_assignment" "cd_reader_io_subscription" {
  provider             = azurerm.io
  scope                = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b"
  role_definition_name = "Reader"
  principal_id         = data.azurerm_user_assigned_identity.cd.principal_id
}

resource "azurerm_role_assignment" "cd_rbac_admin_io_rg_cgn" {
  provider             = azurerm.io
  scope                = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-cgn"
  role_definition_name = "Role Based Access Control Administrator"
  principal_id         = data.azurerm_user_assigned_identity.cd.principal_id
}

# For azurerm_cosmosdb_sql_role_assignment, the CD identity also needs DocumentDB Account Contributor
resource "azurerm_role_assignment" "cd_cosmosdb_contributor_io_rg_cgn" {
  provider             = azurerm.io
  scope                = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-cgn"
  role_definition_name = "DocumentDB Account Contributor"
  principal_id         = data.azurerm_user_assigned_identity.cd.principal_id
}