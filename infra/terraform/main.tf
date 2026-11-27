terraform {
  required_version = ">= 1.6"
  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 6.0" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }

  # State holds generated secrets, so it must live in an encrypted, private
  # bucket - never commit terraform.tfstate. Create the bucket once, then
  # uncomment and run `terraform init -migrate-state`.
  # backend "s3" {
  #   bucket       = "ameer-kisaan-tfstate-<account-id>"
  #   key          = "prod/terraform.tfstate"
  #   region       = "ap-south-1"
  #   encrypt      = true
  #   use_lockfile = true
  # }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project     = "ameer-kisaan"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" { state = "available" }

locals {
  name       = "ameer-kisaan-${var.environment}"
  account_id = data.aws_caller_identity.current.account_id
  azs        = slice(data.aws_availability_zones.available.names, 0, 2)
  # Must match app/db/dynamo.py TABLES and the backend's TABLE_PREFIX
  table_prefix = "${local.name}-"
}

# --- Zero-cost guard -----------------------------------------------------------
# Production runs free on Render + Supabase (see DEPLOY.md). This AWS stack is NOT free:
# roughly $130-180/month (NAT gateway, load balancer, WAF, Fargate). It refuses to plan or
# apply unless you explicitly accept AWS charges.
variable "accept_aws_charges" {
  description = "Set to true only if you agree to pay AWS for this stack (about $130-180/month)."
  type        = bool
  default     = false
}

resource "terraform_data" "zero_cost_guard" {
  lifecycle {
    precondition {
      condition     = var.accept_aws_charges
      error_message = "This AWS stack costs money (about $130-180/month). Ameer Kisaan runs free on Render + Supabase; see DEPLOY.md. Set accept_aws_charges = true only if you really intend to pay AWS."
    }
  }
}
