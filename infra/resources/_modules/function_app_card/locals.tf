locals {
  cgn_card = {
    app_settings = {
      FUNCTIONS_WORKER_PROCESS_COUNT = 4
      NODE_ENV                       = "production"

      // APP INSIGHTS
      APPINSIGHTS_INSTRUMENTATIONKEY  = var.ai_instrumentation_key
      APPINSIGHTS_CONNECTION_STRING   = var.ai_connection_string
      APPINSIGHTS_SAMPLING_PERCENTAGE = var.ai_sampling_percentage

      // REDIS
      REDIS_URL             = var.redis_url
      REDIS_PORT            = var.redis_port
      REDIS_PASSWORD        = var.redis_password
      REDIS_CLUSTER_ENABLED = "false"
      REDIS_TLS_ENABLED     = "true"

      // COSMOS
      COSMOSDB_CGN_URI           = var.cosmosdb_cgn_uri
      COSMOSDB_CGN_KEY           = var.cosmosdb_cgn_key
      COSMOSDB_CGN_DATABASE_NAME = var.cosmosdb_cgn_database_name

      // STORAGE
      CGN_STORAGE_CONNECTION_STRING = var.storage_cgn_connection_string

      // TABLE STORAGE
      CGN_EXPIRATION_TABLE_NAME  = var.table_cgn_expiration
      EYCA_EXPIRATION_TABLE_NAME = var.table_eyca_expiration

      // QUEUE STORAGE
      PENDING_CGN_QUEUE_NAME    = var.pending_cgn_queue_name
      PENDING_EYCA_QUEUE_NAME   = var.pending_eyca_queue_name
      ACTIVATED_CGN_QUEUE_NAME  = var.activated_cgn_queue_name
      ACTIVATED_EYCA_QUEUE_NAME = var.activated_eyca_queue_name

      // EYCA CCDB
      EYCA_API_BASE_URL = var.eyca_api_base_url
      EYCA_API_USERNAME = var.eyca_api_username
      EYCA_API_PASSWORD = var.eyca_api_password

      // LEGAL BACKUP
      CGN_DATA_BACKUP_CONNECTION           = var.cgn_legal_backup_storage_connection
      CGN_CARDS_DATA_BACKUP_CONTAINER_NAME = var.cgn_legal_backup_container_name
      CGN_CARDS_DATA_BACKUP_FOLDER_NAME    = var.cgn_legal_backup_folder_name

      // UTILS
      OTP_TTL_IN_SECONDS   = var.otp_ttl_in_seconds
      CGN_UPPER_BOUND_AGE  = var.cgn_upper_bound_age
      EYCA_UPPER_BOUND_AGE = var.eyca_upper_bound_age

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
