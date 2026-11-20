# --- Container registry -------------------------------------------------------

resource "aws_ecr_repository" "r" {
  for_each             = toset(["frontend", "backend"])
  name                 = "${local.name}-${each.key}"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration { scan_on_push = true }
  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.main.arn
  }
}

resource "aws_ecr_lifecycle_policy" "r" {
  for_each   = aws_ecr_repository.r
  repository = each.value.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the last 20 images"
      selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 20 }
      action       = { type = "expire" }
    }]
  })
}

# --- Load balancer: HTTPS only, /api/* to the backend, everything else to the web app

resource "aws_lb" "main" {
  name                       = local.name
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.alb.id]
  subnets                    = aws_subnet.public[*].id
  drop_invalid_header_fields = true
  enable_deletion_protection = true
}

resource "aws_lb_target_group" "frontend" {
  name        = "${local.name}-web"
  port        = 8080
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id
  health_check {
    path    = "/"
    matcher = "200"
  }
}

resource "aws_lb_target_group" "backend" {
  name        = "${local.name}-api"
  port        = 8000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id
  health_check {
    path    = "/health/ready"
    matcher = "200"
  }
  deregistration_delay = 30
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
  condition {
    path_pattern { values = ["/api/*"] }
  }
}

# --- ECS Fargate --------------------------------------------------------------

resource "aws_ecs_cluster" "main" {
  name = local.name
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "svc" {
  for_each          = toset(["frontend", "backend"])
  name              = "/ecs/${local.name}/${each.key}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.main.arn
}

locals {
  secret_arn = { for k, s in aws_secretsmanager_secret.s : k => s.arn }
  log_config = { for k, g in aws_cloudwatch_log_group.svc : k => {
    logDriver = "awslogs"
    options   = { awslogs-group = g.name, awslogs-region = var.region, awslogs-stream-prefix = k }
  } }
  llm_key_env = var.llm_provider == "openai" ? "OPENAI_API_KEY" : "AZURE_OPENAI_API_KEY"
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${local.name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 1024
  memory                   = 2048
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.backend.arn
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }
  volume { name = "tmp" }

  container_definitions = jsonencode([{
    name                   = "backend"
    image                  = "${aws_ecr_repository.r["backend"].repository_url}:${var.image_tag}"
    essential              = true
    readonlyRootFilesystem = true
    user                   = "app"
    portMappings           = [{ containerPort = 8000, protocol = "tcp" }]
    mountPoints            = [{ sourceVolume = "tmp", containerPath = "/tmp" }]
    linuxParameters        = { capabilities = { drop = ["ALL"] }, initProcessEnabled = true }
    logConfiguration       = local.log_config["backend"]
    environment = [
      { name = "APP_ENV", value = var.environment == "prod" ? "prod" : "staging" },
      { name = "AWS_REGION", value = var.region },
      { name = "TABLE_PREFIX", value = local.table_prefix },
      { name = "S3_BUCKET", value = aws_s3_bucket.uploads.bucket },
      { name = "CORS_ORIGINS", value = "https://${var.domain_name}" },
      { name = "COOKIE_SECURE", value = "true" },
      { name = "LLM_PROVIDER", value = var.llm_provider },
      { name = "EMBEDDINGS_PROVIDER", value = var.llm_provider },
      { name = "INDEX_CACHE_DIR", value = "/tmp/index" },
    ]
    secrets = [
      { name = "JWT_SECRET", valueFrom = local.secret_arn["jwt-secret"] },
      { name = "FIELD_ENCRYPTION_KEY", valueFrom = local.secret_arn["field-encryption-key"] },
      { name = local.llm_key_env, valueFrom = local.secret_arn["llm-api-key"] },
    ]
  }])
}

resource "aws_ecs_task_definition" "frontend" {
  family                   = "${local.name}-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.frontend.arn
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }
  volume { name = "tmp" }
  volume { name = "nginx-conf" }

  container_definitions = jsonencode([{
    name                   = "frontend"
    image                  = "${aws_ecr_repository.r["frontend"].repository_url}:${var.image_tag}"
    essential              = true
    readonlyRootFilesystem = true
    portMappings           = [{ containerPort = 8080, protocol = "tcp" }]
    mountPoints = [
      { sourceVolume = "tmp", containerPath = "/tmp" },
      { sourceVolume = "nginx-conf", containerPath = "/etc/nginx/conf.d" },
    ]
    linuxParameters  = { capabilities = { drop = ["ALL"] } }
    logConfiguration = local.log_config["frontend"]
    # The ALB sends /api/* straight to the backend, so nginx never proxies in AWS.
    environment = [{ name = "BACKEND_UPSTREAM", value = "http://127.0.0.1:8000" }]
  }])
}

resource "aws_ecs_service" "svc" {
  for_each = {
    frontend = { td = aws_ecs_task_definition.frontend.arn, tg = aws_lb_target_group.frontend.arn, port = 8080, count = var.frontend_desired_count }
    backend  = { td = aws_ecs_task_definition.backend.arn, tg = aws_lb_target_group.backend.arn, port = 8000, count = var.backend_desired_count }
  }
  name                               = each.key
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = each.value.td
  desired_count                      = each.value.count
  launch_type                        = "FARGATE"
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 60

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.tasks[each.key].id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = each.value.tg
    container_name   = each.key
    container_port   = each.value.port
  }

  # CI deploys new image revisions and autoscaling changes the count, so
  # Terraform must not roll either back on the next apply.
  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }

  depends_on = [aws_lb_listener.https]
}

resource "aws_appautoscaling_target" "backend" {
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.svc["backend"].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity       = var.backend_desired_count
  max_capacity       = var.backend_desired_count * 4
}

resource "aws_appautoscaling_policy" "backend_cpu" {
  name               = "${local.name}-backend-cpu"
  service_namespace  = "ecs"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  policy_type        = "TargetTrackingScaling"
  target_tracking_scaling_policy_configuration {
    target_value = 60
    predefined_metric_specification { predefined_metric_type = "ECSServiceAverageCPUUtilization" }
  }
}
