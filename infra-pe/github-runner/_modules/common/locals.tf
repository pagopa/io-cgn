locals {
  project  = "${var.prefix}-${var.env_short}-${var.domain}"
  location = { weu = "westeurope", itn = "italynorth" }
}
