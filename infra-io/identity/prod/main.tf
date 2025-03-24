terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "iopitntfst001"
    container_name       = "terraform-state"
    key                  = "io-cgn.identity.prod.tfstate"
    use_azuread_auth     = true
  }
}

provider "azurerm" {
  features {
  }
}

provider "azurerm" {
  features {}
  alias           = "peprod"
  subscription_id = "74da48a3-b0e7-489d-8172-da79801086ed"
}

module "federated_identities" {
  source  = "pagopa-dx/azure-federated-identity-with-github/azurerm"
  version = "~> 1.0"

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location
    domain          = local.domain
    instance_number = "01"
  }

  repository = {
    name = local.repo_name
  }

  resource_group_name = azurerm_resource_group.cgn_itn_01.name

  subscription_id = data.azurerm_subscription.current.id

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
  source  = "pagopa-dx/azure-federated-identity-with-github/azurerm"
  version = "~> 1.0"

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location
    domain          = local.domain
    instance_number = "01"
  }

  repository = {
    name = local.repo_name
  }

  resource_group_name = azurerm_resource_group.cgn_itn_01.name

  subscription_id = data.azurerm_subscription.current.id

  identity_type = "app"

  continuos_integration = { enable = false }

  tags = local.tags
}

resource "azurerm_role_assignment" "ci_cgn" {
  provider             = azurerm.peprod
  scope                = data.azurerm_subscription.cgn.id
  principal_id         = module.federated_identities.federated_ci_identity.id
  role_definition_name = "Reader"
}

resource "azurerm_role_assignment" "cd_cgn" {
  provider             = azurerm.peprod
  scope                = data.azurerm_subscription.cgn.id
  principal_id         = module.federated_identities.federated_cd_identity.id
  role_definition_name = "Contributor"
}
