terraform {

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfappprodio"
    container_name       = "terraform-state"
    key                  = "io-cgn.resources.tfstate"
  }

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "<= 3.106.1"
    }
  }
}

provider "azurerm" {
  features {}
  alias           = "uatesercenti"
  subscription_id = "d1a90d9f-6ee1-4fb2-a149-7aedbf3ed49d"
}

resource "azurerm_resource_group" "itn_pe_cgn" {
  name     = "${local.project}-${local.domain}-pe-rg-01"
  location = local.location
}