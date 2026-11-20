variable "region" {
  description = "AWS region (Mumbai by default, closest to Jharkhand users)."
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment name, e.g. prod or staging."
  type        = string
  default     = "prod"
}

variable "domain_name" {
  description = "Public hostname for the app, e.g. app.ameerkisaan.in. Point it at the ALB (output alb_dns_name)."
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN for domain_name, in the same region. HTTPS is mandatory."
  type        = string
}

variable "image_tag" {
  description = "Container image tag to deploy (CI uses the git commit SHA)."
  type        = string
}

variable "llm_provider" {
  description = "openai or azure_openai. Set the API key in Secrets Manager after the first apply (see README)."
  type        = string
  default     = "openai"
  validation {
    condition     = contains(["openai", "azure_openai"], var.llm_provider)
    error_message = "llm_provider must be openai or azure_openai in AWS (Ollama is for local use)."
  }
}

variable "backend_desired_count" {
  type    = number
  default = 2
}

variable "frontend_desired_count" {
  type    = number
  default = 2
}

variable "github_repository" {
  description = "owner/repo allowed to deploy via GitHub Actions OIDC (no long-lived AWS keys). Empty disables it."
  type        = string
  default     = ""
}

variable "alarm_email" {
  description = "Email for CloudWatch alarm notifications. Empty disables notifications."
  type        = string
  default     = ""
}

variable "log_retention_days" {
  type    = number
  default = 90
}
