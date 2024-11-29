output "postgresql_db" {
  value = {
    postgres                 = module.postgresql_db.postgres
    postgres_replica         = module.postgresql_db.postgres_replica
    private_endpoint         = module.postgresql_db.private_endpoint
    private_endpoint_replica = module.postgresql_db.private_endpoint_replica
  }
}
