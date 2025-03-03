resource "github_repository_environment" "github_repository_environment_prod_ci" {
  environment = "io-prod-ci"
  repository  = local.repository

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

resource "github_actions_environment_secret" "env_prod_ci_secrets" {
  for_each = local.ci.secrets

  repository      = local.repository
  environment     = github_repository_environment.github_repository_environment_prod_ci.environment
  secret_name     = each.key
  plaintext_value = each.value
}
