locals {
  cgn_support = {
    app_settings = {
      FUNCTIONS_WORKER_PROCESS_COUNT = 4
      NODE_ENV                       = "production"

      // COSMOS
      COSMOSDB_CGN_URI           = var.cosmosdb_cgn_uri
      COSMOSDB_CGN_KEY           = var.cosmosdb_cgn_key
      COSMOSDB_CGN_DATABASE_NAME = var.cosmosdb_cgn_database_name

      // STORAGE
      CGN_STORAGE_CONNECTION_STRING = var.storage_cgn_connection_string

      // TABLE STORAGE
      CGN_EXPIRATION_TABLE_NAME  = var.table_cgn_expiration
      EYCA_EXPIRATION_TABLE_NAME = var.table_eyca_expiration

      // Keepalive fields are all optionals
      FETCH_KEEPALIVE_ENABLED             = "true"
      FETCH_KEEPALIVE_SOCKET_ACTIVE_TTL   = "110000"
      FETCH_KEEPALIVE_MAX_SOCKETS         = "40"
      FETCH_KEEPALIVE_MAX_FREE_SOCKETS    = "10"
      FETCH_KEEPALIVE_FREE_SOCKET_TIMEOUT = "30000"
      FETCH_KEEPALIVE_TIMEOUT             = "60000"
    }
  }
}
