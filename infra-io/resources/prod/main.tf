terraform {

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "iopitntfst001"
    container_name       = "terraform-state"
    key                  = "io-cgn.resources.tfstate"
    use_azuread_auth     = true
  }

  required_providers {
    azurerm = {
      source = "hashicorp/azurerm"
    }
  }
}

provider "azurerm" {
  features {}
  storage_use_azuread = true
}

# RESOURCE GROUP
data "azurerm_resource_group" "itn_cgn" {
  name = "${local.project}-${local.domain}-rg-01"
}

# KEY VAULTS
module "key_vaults" {
  source = "../_modules/key_vaults"

  project             = local.project
  location            = local.location
  resource_group_name = data.azurerm_resource_group.itn_cgn.name

  tenant_id = data.azurerm_client_config.current.tenant_id

  tags = local.tags
}

