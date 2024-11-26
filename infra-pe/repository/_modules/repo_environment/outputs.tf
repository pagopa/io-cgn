output "environment" {
  value = {
    ci     = github_repository_environment.github_repository_environment_ci.environment
    cd     = github_repository_environment.github_repository_environment_cd.environment
    app_cd = github_repository_environment.github_repository_environment_app_cd.environment
  }
}
