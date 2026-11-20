# Least-privilege roles. The backend can touch only its own tables, bucket and
# key; the audit table is append-only (no Update/Delete permission at all).

data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = ["arn:aws:ecs:${var.region}:${local.account_id}:*"]
    }
  }
}

# Execution role: used by ECS itself to pull images, write logs and inject secrets.
resource "aws_iam_role" "execution" {
  name               = "${local.name}-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "execution_secrets" {
  role = aws_iam_role.execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = [for s in aws_secretsmanager_secret.s : s.arn]
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = [aws_kms_key.main.arn]
      },
    ]
  })
}

# Task role: what the running backend code may do.
resource "aws_iam_role" "backend" {
  name               = "${local.name}-backend"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

locals {
  data_tables = [for k, t in aws_dynamodb_table.t : t.arn if k != "audit"]
  audit_table = aws_dynamodb_table.t["audit"].arn
}

resource "aws_iam_role_policy" "backend" {
  role = aws_iam_role.backend.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AppTables"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem",
          "dynamodb:Query", "dynamodb:Scan", "dynamodb:BatchWriteItem", "dynamodb:DescribeTable",
          "dynamodb:ConditionCheckItem",
        ]
        Resource = concat(local.data_tables, [for a in local.data_tables : "${a}/index/*"])
      },
      {
        Sid      = "AuditAppendOnly"
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem", "dynamodb:Query", "dynamodb:DescribeTable"]
        Resource = [local.audit_table]
      },
      {
        Sid      = "ReportPhotos"
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
        Resource = ["${aws_s3_bucket.uploads.arn}/reports/*"]
      },
      {
        Sid      = "DataKey"
        Effect   = "Allow"
        Action   = ["kms:Decrypt", "kms:GenerateDataKey"]
        Resource = [aws_kms_key.main.arn]
      },
    ]
  })
}

# Frontend containers need no AWS permissions at all.
resource "aws_iam_role" "frontend" {
  name               = "${local.name}-frontend"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

# --- GitHub Actions deploys via OIDC: short-lived credentials, no stored keys --

resource "aws_iam_openid_connect_provider" "github" {
  count          = var.github_repository == "" ? 0 : 1
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

resource "aws_iam_role" "deploy" {
  count = var.github_repository == "" ? 0 : 1
  name  = "${local.name}-github-deploy"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github[0].arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = { "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com" }
        # Only the main branch of this repository may deploy
        StringLike = { "token.actions.githubusercontent.com:sub" = "repo:${var.github_repository}:ref:refs/heads/main" }
      }
    }]
  })
}

resource "aws_iam_role_policy" "deploy" {
  count = var.github_repository == "" ? 0 : 1
  role  = aws_iam_role.deploy[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Effect = "Allow", Action = ["ecr:GetAuthorizationToken"], Resource = "*" },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability", "ecr:InitiateLayerUpload", "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload", "ecr:PutImage", "ecr:BatchGetImage", "ecr:DescribeImages",
        ]
        Resource = [for r in aws_ecr_repository.r : r.arn]
      },
      {
        Effect   = "Allow"
        Action   = ["ecs:DescribeTaskDefinition", "ecs:RegisterTaskDefinition", "ecs:UpdateService", "ecs:DescribeServices"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["iam:PassRole"]
        Resource = [aws_iam_role.execution.arn, aws_iam_role.backend.arn, aws_iam_role.frontend.arn]
      },
    ]
  })
}
