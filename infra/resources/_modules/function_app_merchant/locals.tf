locals {
  cgn_merchant = {
    app_settings = {
      FUNCTIONS_WORKER_PROCESS_COUNT = 4
      NODE_ENV                       = "production"

      // APP INSIGHTS
      APPINSIGHTS_INSTRUMENTATIONKEY  = var.ai_instrumentation_key
      APPINSIGHTS_CONNECTION_STRING   = var.ai_connection_string
      APPINSIGHTS_SAMPLING_PERCENTAGE = var.ai_sampling_percentage

      // REDIS
      REDIS_URL      = var.redis_url
      REDIS_PORT     = var.redis_port
      REDIS_PASSWORD = var.redis_password

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
