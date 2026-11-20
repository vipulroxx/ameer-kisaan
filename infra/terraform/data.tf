# Customer-managed KMS key for every data store, log group and secret.
resource "aws_kms_key" "main" {
  description             = "${local.name} data encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AccountAdmin"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${local.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "CloudWatchLogs"
        Effect    = "Allow"
        Principal = { Service = "logs.${var.region}.amazonaws.com" }
        Action    = ["kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:Describe*"]
        Resource  = "*"
        Condition = { ArnLike = { "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.region}:${local.account_id}:*" } }
      },
    ]
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name}"
  target_key_id = aws_kms_key.main.key_id
}

# --- DynamoDB (mirrors src/Backend/app/db/dynamo.py) ------------------------

locals {
  tables = {
    users     = { hash = "pk", range = null, attrs = { pk = "S" }, gsis = [], ttl = null }
    sessions  = { hash = "pk", range = null, attrs = { pk = "S" }, gsis = [], ttl = "expires_at" }
    inventory = { hash = "owner_id", range = "item_id", attrs = { owner_id = "S", item_id = "S" }, gsis = [], ttl = null }
    forum = {
      hash = "pk", range = "sk", attrs = { pk = "S", sk = "S", feed = "S", created_at = "S" }, ttl = null
      gsis = [{ name = "feed-index", hash = "feed", range = "created_at" }]
    }
    reports = {
      hash = "owner_id", range = "report_id", attrs = { owner_id = "S", report_id = "S", status = "S", created_at = "S" }, ttl = null
      gsis = [{ name = "status-index", hash = "status", range = "created_at" }]
    }
    audit = { hash = "day", range = "event_id", attrs = { day = "S", event_id = "S" }, gsis = [], ttl = null }
    chat  = { hash = "user_id", range = "message_id", attrs = { user_id = "S", message_id = "S" }, gsis = [], ttl = "expires_at" }
  }
}

resource "aws_dynamodb_table" "t" {
  for_each                    = local.tables
  name                        = "${local.table_prefix}${each.key}"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = each.value.hash
  range_key                   = each.value.range
  deletion_protection_enabled = true

  dynamic "attribute" {
    for_each = each.value.attrs
    content {
      name = attribute.key
      type = attribute.value
    }
  }

  dynamic "global_secondary_index" {
    for_each = each.value.gsis
    content {
      name            = global_secondary_index.value.name
      hash_key        = global_secondary_index.value.hash
      range_key       = global_secondary_index.value.range
      projection_type = "ALL"
    }
  }

  dynamic "ttl" {
    for_each = each.value.ttl == null ? [] : [each.value.ttl]
    content {
      attribute_name = ttl.value
      enabled        = true
    }
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  point_in_time_recovery {
    enabled = true
  }
}

# --- S3: crop report photos -------------------------------------------------

resource "aws_s3_bucket" "uploads" {
  bucket = "${local.name}-uploads-${local.account_id}"
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  rule { object_ownership = "BucketOwnerEnforced" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  rule {
    id     = "expire-old-versions"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration { noncurrent_days = 30 }
    abort_incomplete_multipart_upload { days_after_initiation = 1 }
  }
}

resource "aws_s3_bucket_policy" "uploads_tls_only" {
  bucket = aws_s3_bucket.uploads.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "DenyInsecureTransport"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource  = [aws_s3_bucket.uploads.arn, "${aws_s3_bucket.uploads.arn}/*"]
      Condition = { Bool = { "aws:SecureTransport" = "false" } }
    }]
  })
  depends_on = [aws_s3_bucket_public_access_block.uploads]
}

# --- Secrets ------------------------------------------------------------------

resource "random_password" "jwt" {
  length  = 64
  special = false
}

resource "random_bytes" "field_key" {
  length = 32
}

resource "aws_secretsmanager_secret" "s" {
  for_each                = toset(["jwt-secret", "field-encryption-key", "llm-api-key"])
  name                    = "${local.name}/${each.key}"
  kms_key_id              = aws_kms_key.main.arn
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id     = aws_secretsmanager_secret.s["jwt-secret"].id
  secret_string = random_password.jwt.result
}

resource "aws_secretsmanager_secret_version" "field_key" {
  secret_id     = aws_secretsmanager_secret.s["field-encryption-key"].id
  secret_string = random_bytes.field_key.base64
}

# Placeholder only: set the real key in the console or with
#   aws secretsmanager put-secret-value --secret-id ameer-kisaan-prod/llm-api-key --secret-string '<key>'
# Terraform never overwrites it afterwards.
resource "aws_secretsmanager_secret_version" "llm" {
  secret_id     = aws_secretsmanager_secret.s["llm-api-key"].id
  secret_string = "REPLACE_ME"
  lifecycle { ignore_changes = [secret_string] }
}
