output "alb_dns_name" {
  description = "Create a CNAME (or Route 53 alias) from domain_name to this."
  value       = aws_lb.main.dns_name
}

output "ecr_repositories" {
  value = { for k, r in aws_ecr_repository.r : k => r.repository_url }
}

output "uploads_bucket" {
  value = aws_s3_bucket.uploads.bucket
}

output "llm_api_key_secret" {
  description = "Put your OpenAI / Azure OpenAI key in this secret after the first apply."
  value       = aws_secretsmanager_secret.s["llm-api-key"].name
}

output "github_deploy_role_arn" {
  description = "Set as the AWS_DEPLOY_ROLE_ARN variable in GitHub repository settings."
  value       = var.github_repository == "" ? null : aws_iam_role.deploy[0].arn
}

output "ecs_cluster" {
  value = aws_ecs_cluster.main.name
}
