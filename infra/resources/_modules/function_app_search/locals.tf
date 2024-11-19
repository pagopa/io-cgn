locals {
  cgn_search = {
    app_settings = {
      FUNCTIONS_WORKER_PROCESS_COUNT = 4
      NODE_ENV                       = "production"

      // POSTGRES
      CGN_POSTGRES_DB_ADMIN_URI   = var.cgn_postgres_db_admin_connection_string
      CGN_POSTGRES_DB_SSL_ENABLED = "true"

      // REDIS
      REDIS_URL             = var.redis_url
      REDIS_PORT            = var.redis_port
      REDIS_PASSWORD        = var.redis_password
      REDIS_CLUSTER_ENABLED = "false"
      REDIS_TLS_ENABLED     = "true"

      // UTILS
      CDN_MERCHANT_IMAGES_BASE_URL = var.cgn_cdn_endpoint_base_url
      CGN_BUCKET_CODE_LOCK_LIMIT   = 101

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
