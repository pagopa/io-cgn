resource "github_repository_environment" "github_repository_environment_cd" {
  environment = "pe-${var.env}-cd"
  repository  = var.repository

  reviewers {
    teams = matchkeys(
      data.github_organization_teams.all.teams[*].id,
      data.github_organization_teams.all.teams[*].slug,
      local.cd.reviewers_teams
    )
  }

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

resource "github_actions_environment_secret" "env_cd_secrets" {
  for_each = local.cd.secrets

  repository      = var.repository
  environment     = github_repository_environment.github_repository_environment_cd.environment
  secret_name     = each.key
  plaintext_value = each.value
}

# Portale Esercenti App CD
resource "github_repository_environment" "github_repository_environment_app_cd" {
  environment = "pe-app-${var.env}-cd"
  repository  = var.repository

  reviewers {
    teams = matchkeys(
      data.github_organization_teams.all.teams[*].id,
      data.github_organization_teams.all.teams[*].slug,
      local.cd.reviewers_teams
    )
  }

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

resource "github_actions_environment_secret" "env_app_cd_secrets" {
  for_each = local.app_cd.secrets

  repository      = var.repository
  environment     = github_repository_environment.github_repository_environment_app_cd.environment
  secret_name     = each.key
  plaintext_value = each.value
}
