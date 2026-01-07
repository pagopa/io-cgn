locals {
  sku_name_mapping = {
    s  = "B1"
    m  = "P0v3"
    l  = "P1v3"
    xl = "P2v3"
  }
  attribute_authority = {
    app_settings = {
      NODE_ENV = "production"

      WEBSITE_NODE_DEFAULT_VERSION        = "18.13.0"
      WEBSITES_ENABLE_APP_SERVICE_STORAGE = false
      WEBSITES_PORT                       = 8080
      SERVER_PORT                         = 8080

      WEBSITE_RUN_FROM_PACKAGE                        = "1"
      WEBSITE_DNS_SERVER                              = "168.63.129.16"
      WEBSITE_ADD_SITENAME_BINDINGS_IN_APPHOST_CONFIG = "1"

      # Postgres
      ATTRIBUTE_AUTHORITY_POSTGRES_DB_SSL_ENABLED = true
      ATTRIBUTE_AUTHORITY_POSTGRES_DB_URI         = var.attribute_authority_postgres_db_admin_connection_string

      # Keepalive fields are all optionals
      FETCH_KEEPALIVE_ENABLED             = "true"
      FETCH_KEEPALIVE_SOCKET_ACTIVE_TTL   = "110000"
      FETCH_KEEPALIVE_MAX_SOCKETS         = "128"
      FETCH_KEEPALIVE_MAX_FREE_SOCKETS    = "10"
      FETCH_KEEPALIVE_FREE_SOCKET_TIMEOUT = "30000"
      FETCH_KEEPALIVE_TIMEOUT             = "60000"
    }
  }
}
