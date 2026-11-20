# GitHub Actions workflows

Move these into place (they could not be written there remotely):

```bash
mkdir -p .github/workflows && git mv infra/github-workflows/*.yml .github/workflows/
```

- `ci.yml`: backend lint, tests and dependency audit; frontend build; `terraform fmt` + `validate`; image build and Trivy scan.
- `deploy.yml`: manual deploy to AWS via GitHub OIDC (see `infra/terraform/README.md`).
