# AWS infrastructure

Terraform for the production stack in `ap-south-1` (Mumbai): VPC (2 AZs, private app subnets, S3/DynamoDB gateway endpoints), ALB with HTTPS and WAF, ECS Fargate services for frontend and backend, DynamoDB tables, a private S3 bucket, one KMS key for everything, Secrets Manager, least-privilege IAM, CloudWatch logs and alarms, ECR, and an optional GitHub OIDC deploy role.

Rough cost at low traffic: about US$90-120/month, mostly the NAT gateway, ALB, WAF and two of each Fargate task. LLM usage is billed separately by OpenAI/Azure.

## First deploy

Prerequisites: an AWS account, Terraform ≥ 1.6, Docker, a domain, and an ACM certificate for it in `ap-south-1`.

1. **State bucket.** Create a private, versioned, encrypted S3 bucket for Terraform state, then uncomment the `backend "s3"` block in `main.tf`. State contains generated secrets, so never keep it locally or in git.
2. **Variables.** `cp terraform.tfvars.example terraform.tfvars` and fill it in.
3. **Registries first, then images:**
   ```bash
   terraform init
   terraform apply -target=aws_ecr_repository.r
   aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.ap-south-1.amazonaws.com
   TAG=$(git rev-parse HEAD)
   docker build -t <backend-repo-url>:$TAG ../../src/Backend && docker push <backend-repo-url>:$TAG
   docker build -t <frontend-repo-url>:$TAG ../.. && docker push <frontend-repo-url>:$TAG
   ```
4. **Everything else:** `terraform apply -var image_tag=$TAG`
5. **LLM key:** `aws secretsmanager put-secret-value --secret-id ameer-kisaan-prod/llm-api-key --secret-string '<your key>'`, then `aws ecs update-service --cluster ameer-kisaan-prod --service backend --force-new-deployment`.
6. **DNS:** point your domain at the `alb_dns_name` output.
7. **Admin:** register in the app, then run `scripts/create_admin.py` once with ECS Exec, or set `role` = `admin` on your `USER#…` item in the `ameer-kisaan-prod-users` table.

## Later deploys

With `github_repository` set, Terraform creates an OIDC role that only the `main` branch of that repo can assume. Add repository variables `AWS_REGION`, `AWS_DEPLOY_ROLE_ARN` (output `github_deploy_role_arn`) and `NAME_PREFIX` (`ameer-kisaan-prod`), plus a `production` environment with required reviewers. Then run the **Deploy** workflow. ECS rolls back automatically if new tasks fail health checks.

Terraform ignores the services' task definition and desired count after creation, so `terraform apply` never rolls back an image that CI deployed.

## Notes

- One NAT gateway keeps costs down. Add one per AZ if you need to survive an AZ outage.
- DynamoDB tables, the ALB and the KMS key have deletion protection. `terraform destroy` will stop until you turn it off, which is deliberate.
- The ALB has no access logs configured. Add an S3 log bucket if you need request-level forensics.
- The crop classifier model is baked into the backend image from `src/Backend/models/`. Train it before building the image you deploy.
