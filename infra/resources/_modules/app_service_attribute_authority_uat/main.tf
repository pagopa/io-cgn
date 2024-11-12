terraform {

  required_providers {
    azurerm = {
      source = "hashicorp/azurerm"
    }
  }
}

provider "azurerm" {
  features {

  }
  alias           = "uatesercenti"
  subscription_id = "d1a90d9f-6ee1-4fb2-a149-7aedbf3ed49d"
}
