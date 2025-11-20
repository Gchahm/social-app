## AWS Setup

### Step 1: Set Up AWS OIDC for GitHub Actions

This allows GitHub Actions to authenticate without storing long-lived AWS credentials.

Below is the TL;DR from  [Github Docs](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws) and [AWS Docs](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html#manage-oidc-provider-cli)

**1. Create OIDC Provider (Run once per AWS account)**

```bash
aws iam list-open-id-connect-providers
```

```bash
aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --client-id-list "sts.amazonaws.com"
```

**2. Create IAM Role for GitHub Actions**

Create file: `github-actions-trust-policy.json`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::{AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:{GITHUB_ORG}/{REPO_NAME}:*"
        }
      }
    }
  ]
}
```

Replace:

- `{AWS_ACCOUNT_ID}` with your AWS account ID
- `{GITHUB_ORG}` with your GitHub organization/username
- `{REPO_NAME}` with your repository name

**3. Create the IAM Role**

```bash
# Create role
aws iam create-role \
  --role-name GitHubActionsDeployRole \
  --assume-role-policy-document file://github-actions-trust-policy.json

# Attach policies (customize based on your needs)
aws iam attach-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# For CDK, also need IAM permissions
aws iam attach-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-arn arn:aws:iam::aws:policy/IAMFullAccess
```

**Note:** In production, use least-privilege policies instead of PowerUserAccess.

**4. Get the Role ARN**

```bash
aws iam get-role --role-name GitHubActionsDeployRole --query 'Role.Arn' --output text
```

Save this ARN - you'll need it for GitHub Secrets.

### Step 2: Bootstrap CDK for Each Environment

```bash
# Development
npx cdk bootstrap aws://ACCOUNT-ID/REGION --context environment=dev

# Staging
npx cdk bootstrap aws://ACCOUNT-ID/REGION --context environment=staging

# Production (if using separate account)
npx cdk bootstrap aws://PROD-ACCOUNT-ID/REGION --context environment=prod
```

---
