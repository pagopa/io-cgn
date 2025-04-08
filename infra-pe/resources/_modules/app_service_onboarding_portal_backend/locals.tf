locals {
  onboarding_portal_backend = {
    app_settings = {
      # APP SETTINGS
      WEBSITES_ENABLE_APP_SERVICE_STORAGE = false
      WEBSITE_ENABLE_SYNC_UPDATE_SITE     = true
      WEBSITES_PORT                       = 8080
      WEBSITE_SWAP_WARMUP_PING_PATH       = "/actuator/health"
      WEBSITE_SWAP_WARMUP_PING_STATUSES   = "200"
      WEBSITE_DNS_SERVER                  = "168.63.129.16"
      WEBSITES_CONTAINER_START_TIME_LIMIT = 600
      WEBSITE_RUN_FROM_PACKAGE            = 0

      # ENVIRONMENT
      SPRING_PROFILES_ACTIVE     = "prod"
      SERVER_PORT                = 8080
      SPRING_DATASOURCE_URL      = var.spring_datasource_url
      SPRING_DATASOURCE_USERNAME = var.spring_datasource_username
      SPRING_DATASOURCE_PASSWORD = var.spring_datasource_password
      JAVA_OPTS                  = "-XX:+UseG1GC -XX:MaxGCPauseMillis=100 -XX:+UseStringDeduplication"

      # BLOB STORAGE SETTINGS
      CGN_PE_STORAGE_AZURE_DEFAULT_ENDPOINTS_PROTOCOL = "https"
      CGN_PE_STORAGE_AZURE_ACCOUNT_NAME               = var.cgn_pe_storage_azure_account_name
      CGN_PE_STORAGE_AZURE_ACCOUNT_KEY                = var.cgn_pe_storage_azure_account_key
      CGN_PE_STORAGE_AZURE_BLOB_ENDPOINT              = var.cgn_pe_storage_azure_blob_endpoint
      CGN_PE_STORAGE_AZURE_DOCUMENTS_CONTAINER_NAME   = "userdocuments"
      CGN_PE_STORAGE_AZURE_IMAGED_CONTAINER_NAME      = "profileimages"

      # FILE UPLOAD SETTINGS
      SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE    = "200MB"
      SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE = "200MB"

      # BUCKET CODE SETTINGS
      CGN_PE_DISCOUNT_BUCKET_MINCSVROWS = "10000"

      # EMAIL
      MANAGEMENT_HEALTH_MAIL_ENABLED                     = "false"
      SPRING_MAIL_HOST                                   = var.spring_mail_host
      SPRING_MAIL_PORT                                   = var.spring_mail_port
      SPRING_MAIL_USERNAME                               = var.spring_mail_username
      SPRING_MAIL_PASSWORD                               = var.spring_mail_password
      SPRING_MAIL_PROPERTIES_MAIL_SMTP_CONNECTIONTIMEOUT = 10000
      SPRING_MAIL_PROPERTIES_MAIL_SMTP_TIMEOUT           = 10000
      SPRING_MAIL_PROPERTIES_MAIL_SMTP_WRITETIMEOUT      = 10000

      CGN_EMAIL_NOTIFICATION_SENDER = "CGN Portal<no-reply@cgn.pagopa.it>"
      CGN_EMAIL_DEPARTMENT_EMAIL    = var.cgn_email_department_email
      CGN_EMAIL_PORTAL_BASE_URL     = var.cgn_email_portal_base_url

      # EYCA EXPORT
      EYCA_EXPORT_USERNAME                   = var.eyca_export_username
      EYCA_EXPORT_PASSWORD                   = var.eyca_export_password
      EYCA_EXPORT_NOT_ALLOWED_DISCOUNT_MODES = "API"

      # APIM API TOKEN
      CGN_APIM_RESOURCEGROUP = var.cgn_apim_resourcegroup
      CGN_APIM_RESOURCE      = var.cgn_apim_resource
      CGN_APIM_PRODUCTID     = var.cgn_apim_productid
      AZURE_SUBSCRIPTION_ID  = var.azure_subscription_id

      # RECAPTCHA
      CGN_RECAPTCHA_SECRET_KEY = var.cgn_recaptcha_secret_key

      # GEOLOCATION
      CGN_GEOLOCATION_SECRET_TOKEN = var.cgn_geolocation_secret_token

      # ATTRIBUTE AUTHORITY
      CGN_ATTRIBUTE_AUTHORITY_BASE_URL = var.cgn_attribute_authority_base_url

      # CRONS
      SEND_DISCOUNTS_TO_EYCA_JOB_CRON = "0 0 2 * * ? *"

      # APPLICATIONINSIGHTS
      APPLICATIONINSIGHTS_CONNECTION_STRING = var.ai_connection_string

      # IDENTITY
      CGN_PORTAL_BASE_URL         = var.cgn_portal_base_url
      ONE_IDENTITY_BASE_URL       = var.one_identity_base_url
      ONE_IDENTITY_ID             = var.one_identity_id
      ONE_IDENTITY_SECRET         = var.one_identity_secret
      ONE_IDENTITY_WELL_KNOWN     = var.one_identity_well_known
      ACTIVE_DIRECTORY_ID         = var.active_directory_id
      ACTIVE_DIRECTORY_WELL_KNOWN = var.active_directory_well_known
      JWT_PRIVATE_KEY             = var.jwt_private_key
      JWT_PUBLIC_KEY              = var.jwt_public_key
    }

    production_slot_settings = {
      # EYCA EXPORT
      EYCA_EXPORT_ENABLED = var.eyca_export_enabled

      # QUARTZ SCHEDULER
      SPRING_QUARTZ_AUTOSTARTUP = var.spring_quartz_autostartup

      # FROM AZURE
      APPINSIGHTS_INSTRUMENTATIONKEY                  = var.appinsights_instrumentationkey
      APPINSIGHTS_PROFILERFEATURE_VERSION             = "1.0.0"
      APPINSIGHTS_SNAPSHOTFEATURE_VERSION             = "1.0.0"
      APPLICATIONINSIGHTS_CONFIGURATION_CONTENT       = ""
      ApplicationInsightsAgent_EXTENSION_VERSION      = "~3"
      DiagnosticServices_EXTENSION_VERSION            = "~3"
      InstrumentationEngine_EXTENSION_VERSION         = "disabled"
      SnapshotDebugger_EXTENSION_VERSION              = "disabled"
      XDT_MicrosoftApplicationInsights_BaseExtensions = "disabled"
      XDT_MicrosoftApplicationInsights_Mode           = "recommended"
      XDT_MicrosoftApplicationInsights_PreemptSdk     = "disabled"
    }

    staging_slot_settings = {
      # EYCA EXPORT
      EYCA_EXPORT_ENABLED = false

      # QUARTZ SCHEDULER
      SPRING_QUARTZ_AUTOSTARTUP = false

      # FROM AZURE
      APPINSIGHTS_INSTRUMENTATIONKEY                  = null
      APPINSIGHTS_PROFILERFEATURE_VERSION             = null
      APPINSIGHTS_SNAPSHOTFEATURE_VERSION             = null
      APPLICATIONINSIGHTS_CONFIGURATION_CONTENT       = null
      ApplicationInsightsAgent_EXTENSION_VERSION      = null
      DiagnosticServices_EXTENSION_VERSION            = null
      InstrumentationEngine_EXTENSION_VERSION         = null
      SnapshotDebugger_EXTENSION_VERSION              = null
      XDT_MicrosoftApplicationInsights_BaseExtensions = null
      XDT_MicrosoftApplicationInsights_Mode           = null
      XDT_MicrosoftApplicationInsights_PreemptSdk     = null
    }
  }
}
