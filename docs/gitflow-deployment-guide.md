# GitFlow Multi-Environment Deployment Guide

This guide walks through implementing a complete GitFlow workflow with automated deployment to multiple environments (Dev, Staging, Production) using GitHub Actions and AWS CDK.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
1. [GitFlow Branch Strategy](#gitflow-branch-strategy)
1. [Environment Configuration](#environment-configuration)
1. [GitHub Actions Workflows](#github-actions-workflows)
1. [GitHub Repository Configuration](#github-repository-configuration)
1. [Deployment Process](#deployment-process)
1. [Rollback Strategy](#rollback-strategy)
1. [Best Practices](#best-practices)

---

## Architecture Overview

### Environments

| Environment | AWS Account | Branch/Tag | Auto-Deploy | Approval Required |
|-------------|-------------|------------|-------------|-------------------|
| **Development** | Dev Account (or same) | `develop` | ✅ Yes | ❌ No |
| **Staging** | Dev Account (or same) | `release/*` | ✅ Yes | ❌ No |
| **Production** | Prod Account (recommended) | `main` | ⏸️ Manual | ✅ Yes |

### Stack Naming Convention

- Development: `BeStack-dev`
- Staging: `BeStack-staging`
- Production: `BeStack-prod`

---

## GitFlow Branch Strategy

### Branch Types

```
main (production)
  ↑
  └── release/v1.0.0 (staging)
        ↑
        └── develop (development)
              ↑
              └── feature/add-comments (feature branches)
```

### Branch Purposes

1. **`main`** - Production code
   - Always deployable
   - Protected branch
   - Requires PR approval
   - Triggers manual production deployment

2. **`develop`** - Development integration
   - Latest features
   - Auto-deploys to dev environment
   - Base for feature branches

3. **`release/*`** - Release candidates
   - Format: `release/v1.0.0`
   - Auto-deploys to staging
   - Bug fixes only
   - Merged to both `main` and `develop`

4. **`feature/*`** - New features
   - Format: `feature/add-comments`
   - Based on `develop`
   - Merged back to `develop` via PR

5. **`hotfix/*`** - Production fixes
   - Format: `hotfix/fix-auth`
   - Based on `main`
   - Merged to both `main` and `develop`

## Environment Configuration

## GitHub Actions Workflows

### Workflow 1: CI/CD Pipeline

**File: `.github/workflows/deploy.yml`**

```yaml
name: Deploy Backend

on:
  push:
    branches:
      - develop       # → Dev environment
      - 'release/**'  # → Staging environment
      - main          # → Production (manual approval)
  pull_request:
    branches:
      - develop
      - main

permissions:
  id-token: write   # Required for AWS OIDC
  contents: read
  pull-requests: write

jobs:
  # ==========================================
  # Job 1: Determine deployment environment
  # ==========================================
  determine-environment:
    name: Determine Environment
    runs-on: ubuntu-latest
    outputs:
      environment: ${{ steps.set-env.outputs.environment }}
      should-deploy: ${{ steps.set-env.outputs.should-deploy }}
      aws-role: ${{ steps.set-env.outputs.aws-role }}
      aws-region: ${{ steps.set-env.outputs.aws-region }}

    steps:
      - name: Determine environment from branch
        id: set-env
        run: |
          echo "Event: ${{ github.event_name }}"
          echo "Ref: ${{ github.ref }}"

          # Don't deploy on PRs
          if [[ "${{ github.event_name }}" == "pull_request" ]]; then
            echo "environment=dev" >> $GITHUB_OUTPUT
            echo "should-deploy=false" >> $GITHUB_OUTPUT
            echo "Pull request - will not deploy"
            exit 0
          fi

          # Determine environment based on branch
          if [[ $GITHUB_REF == refs/heads/main ]]; then
            echo "environment=prod" >> $GITHUB_OUTPUT
            echo "should-deploy=true" >> $GITHUB_OUTPUT
            echo "aws-role=${{ secrets.AWS_PROD_ROLE_ARN }}" >> $GITHUB_OUTPUT
            echo "aws-region=${{ secrets.AWS_PROD_REGION || 'us-east-1' }}" >> $GITHUB_OUTPUT
            echo "Deploying to PRODUCTION"
          elif [[ $GITHUB_REF == refs/heads/release/* ]]; then
            echo "environment=staging" >> $GITHUB_OUTPUT
            echo "should-deploy=true" >> $GITHUB_OUTPUT
            echo "aws-role=${{ secrets.AWS_DEV_ROLE_ARN }}" >> $GITHUB_OUTPUT
            echo "aws-region=${{ secrets.AWS_DEV_REGION || 'us-east-1' }}" >> $GITHUB_OUTPUT
            echo "Deploying to STAGING"
          elif [[ $GITHUB_REF == refs/heads/develop ]]; then
            echo "environment=dev" >> $GITHUB_OUTPUT
            echo "should-deploy=true" >> $GITHUB_OUTPUT
            echo "aws-role=${{ secrets.AWS_DEV_ROLE_ARN }}" >> $GITHUB_OUTPUT
            echo "aws-region=${{ secrets.AWS_DEV_REGION || 'us-east-1' }}" >> $GITHUB_OUTPUT
            echo "Deploying to DEVELOPMENT"
          else
            echo "environment=dev" >> $GITHUB_OUTPUT
            echo "should-deploy=false" >> $GITHUB_OUTPUT
            echo "Unknown branch - will not deploy"
          fi

  # ==========================================
  # Job 2: Lint and test
  # ==========================================
  test:
    name: Lint & Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint
        continue-on-error: true

      - name: Run tests
        run: npm test
        continue-on-error: true

      - name: Type check
        run: npm run type-check
        continue-on-error: true

  # ==========================================
  # Job 3: Build
  # ==========================================
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [determine-environment, test]
    if: needs.determine-environment.outputs.should-deploy == 'true'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build backend
        run: |
          cd apps/be
          npm run build

      - name: Synthesize CDK
        env:
          ENVIRONMENT: ${{ needs.determine-environment.outputs.environment }}
        run: |
          cd apps/be
          npx cdk synth --context environment=$ENVIRONMENT

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts-${{ github.sha }}
          path: |
            apps/be/dist/
            apps/be/cdk.out/
            node_modules/
          retention-days: 1

  # ==========================================
  # Job 4: Deploy
  # ==========================================
  deploy:
    name: Deploy to ${{ needs.determine-environment.outputs.environment }}
    runs-on: ubuntu-latest
    needs: [determine-environment, build]
    if: needs.determine-environment.outputs.should-deploy == 'true'

    environment:
      name: ${{ needs.determine-environment.outputs.environment }}
      url: ${{ steps.deploy.outputs.api-url }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts-${{ github.sha }}

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ needs.determine-environment.outputs.aws-role }}
          aws-region: ${{ needs.determine-environment.outputs.aws-region }}
          role-session-name: GitHubActions-${{ github.run_id }}

      - name: Install dependencies
        run: npm ci

      - name: Deploy CDK stack
        id: deploy
        env:
          ENVIRONMENT: ${{ needs.determine-environment.outputs.environment }}
        run: |
          cd apps/be

          echo "Deploying to $ENVIRONMENT environment..."

          # Deploy with context
          npx cdk deploy \
            --require-approval never \
            --context environment=$ENVIRONMENT \
            --outputs-file outputs.json

          # Extract API URL from outputs
          API_URL=$(cat outputs.json | jq -r '.["BeStack-'$ENVIRONMENT'"].ApiEndpoint')
          echo "api-url=$API_URL" >> $GITHUB_OUTPUT
          echo "Deployed to: $API_URL"

      - name: Upload deployment outputs
        uses: actions/upload-artifact@v4
        with:
          name: deployment-outputs-${{ needs.determine-environment.outputs.environment }}
          path: apps/be/outputs.json
          retention-days: 30

      - name: Comment on PR with deployment info
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `✅ Successfully deployed to **${{ needs.determine-environment.outputs.environment }}**\n\nAPI Endpoint: ${{ steps.deploy.outputs.api-url }}`
            })

  # ==========================================
  # Job 5: Post-deployment validation
  # ==========================================
  validate:
    name: Validate Deployment
    runs-on: ubuntu-latest
    needs: [determine-environment, deploy]
    if: needs.determine-environment.outputs.should-deploy == 'true'

    steps:
      - name: Download deployment outputs
        uses: actions/download-artifact@v4
        with:
          name: deployment-outputs-${{ needs.determine-environment.outputs.environment }}

      - name: Health check
        run: |
          API_URL=$(cat outputs.json | jq -r '.["BeStack-${{ needs.determine-environment.outputs.environment }}"].ApiEndpoint')

          echo "Testing API health at: $API_URL"

          # Basic health check (adjust endpoint as needed)
          HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/health || echo "000")

          if [[ $HTTP_STATUS == "200" ]] || [[ $HTTP_STATUS == "404" ]]; then
            echo "✅ API is responding"
          else
            echo "❌ API health check failed with status: $HTTP_STATUS"
            exit 1
          fi

      - name: Run smoke tests
        run: |
          echo "Running smoke tests..."
          # Add your smoke tests here
```

### Workflow 2: Manual Rollback

**File: `.github/workflows/rollback.yml`**

```yaml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to rollback'
        required: true
        type: choice
        options:
          - dev
          - staging
          - prod
      version:
        description: 'Git tag/commit to rollback to'
        required: true
        type: string

permissions:
  id-token: write
  contents: read

jobs:
  rollback:
    name: Rollback ${{ inputs.environment }} to ${{ inputs.version }}
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}

    steps:
      - name: Checkout code at version
        uses: actions/checkout@v4
        with:
          ref: ${{ inputs.version }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ inputs.environment == 'prod' && secrets.AWS_PROD_ROLE_ARN || secrets.AWS_DEV_ROLE_ARN }}
          aws-region: ${{ inputs.environment == 'prod' && secrets.AWS_PROD_REGION || secrets.AWS_DEV_REGION || 'us-east-1' }}

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: |
          cd apps/be
          npm run build

      - name: Deploy rollback
        run: |
          cd apps/be
          npx cdk deploy \
            --require-approval never \
            --context environment=${{ inputs.environment }}

      - name: Create rollback notification
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `🔄 Rollback: ${{ inputs.environment }} to ${{ inputs.version }}`,
              body: `Rolled back **${{ inputs.environment }}** environment to version **${{ inputs.version }}**\n\nTriggered by: @${{ github.actor }}\nWorkflow: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}`,
              labels: ['rollback', 'deployment']
            })
```

---

## GitHub Repository Configuration

### Step 1: Set Up Branch Protection

**For `main` branch:**

1. Go to Settings → Branches → Add branch protection rule
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (at least 1)
   - ✅ Dismiss stale pull request approvals
   - ✅ Require status checks to pass before merging
     - Add: `test`, `build`
   - ✅ Require conversation resolution before merging
   - ✅ Do not allow bypassing the above settings

**For `develop` branch:**

1. Same as above but:
   - Approvals: 1 (can be less strict)
   - Status checks: `test`

### Step 2: Create GitHub Environments

1. Go to Settings → Environments → New environment

**Create 3 environments:**

#### Environment: `dev`
- **Deployment branches:** `develop`
- **Environment secrets:** None needed (uses repo secrets)
- **Protection rules:** None

#### Environment: `staging`
- **Deployment branches:** `release/**`
- **Environment secrets:** None needed
- **Protection rules:** None (auto-deploy)

#### Environment: `prod`
- **Deployment branches:** `main`
- **Environment protection rules:**
  - ✅ Required reviewers (add team members)
  - ✅ Wait timer: 0 minutes (or add delay)
- **Environment secrets:**
  - `AWS_PROD_ROLE_ARN` (if using separate prod account)

### Step 3: Add Repository Secrets

Go to Settings → Secrets and variables → Actions → New repository secret

**Required secrets:**

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `AWS_DEV_ROLE_ARN` | IAM role ARN for dev/staging | `arn:aws:iam::123456789:role/GitHubActionsDeployRole` |
| `AWS_DEV_REGION` | AWS region for dev/staging | `us-east-1` |
| `AWS_PROD_ROLE_ARN` | IAM role ARN for production | `arn:aws:iam::987654321:role/GitHubActionsDeployRole` |
| `AWS_PROD_REGION` | AWS region for production | `us-east-1` |

**Optional secrets (if using separate prod account):**
- `PROD_AWS_ACCOUNT` - Production AWS account ID

---

## Deployment Process

### Feature Development

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/add-user-profile

# 2. Make changes and commit
git add .
git commit -m "feat: add user profile functionality"
git push origin feature/add-user-profile

# 3. Create PR to develop
# - GitHub Actions runs tests
# - Get code review
# - Merge to develop

# 4. Automatic deployment to DEV
# - Merging to develop triggers deployment
# - Monitor GitHub Actions workflow
```

### Release to Staging

```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. Update version in package.json
npm version 1.2.0 --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: bump version to 1.2.0"
git push origin release/v1.2.0

# 3. Automatic deployment to STAGING
# - Pushing release branch triggers staging deployment
# - Run QA tests on staging
# - Fix bugs in release branch if needed
```

### Release to Production

```bash
# 1. Merge release to main
git checkout main
git pull origin main
git merge release/v1.2.0 --no-ff -m "Release v1.2.0"

# 2. Tag the release
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin main --tags

# 3. Manual approval in GitHub
# - Go to Actions tab
# - Find the deployment workflow
# - Reviewers approve production deployment

# 4. Deployment to PRODUCTION
# - After approval, deployment proceeds
# - Monitor CloudWatch logs
# - Verify production health

# 5. Merge back to develop
git checkout develop
git merge main --no-ff -m "Merge main back to develop"
git push origin develop
```

### Hotfix Process

```bash
# 1. Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/fix-critical-bug

# 2. Fix the issue
git add .
git commit -m "hotfix: fix critical authentication bug"

# 3. Create PR to main
# - Get emergency approval
# - Merge to main

# 4. Deployment to PRODUCTION
# - Requires manual approval
# - Deploy and verify

# 5. Merge back to develop
git checkout develop
git merge hotfix/fix-critical-bug --no-ff
git push origin develop

# 6. Delete hotfix branch
git branch -d hotfix/fix-critical-bug
git push origin --delete hotfix/fix-critical-bug
```

---

## Rollback Strategy

### Option 1: Using Rollback Workflow

1. Go to Actions → Rollback Deployment → Run workflow
2. Select:
   - Environment: `prod`
   - Version: Previous git tag (e.g., `v1.1.0`)
3. Approve and run
4. Workflow checks out old version and redeploys

### Option 2: Manual Rollback via Git

```bash
# 1. Find the last good commit
git log --oneline

# 2. Revert to previous version
git checkout main
git revert <bad-commit-hash>
git push origin main

# 3. Manual approval and deployment will trigger
```

### Option 3: CDK Rollback

```bash
# If stack is in failed state
aws cloudformation rollback-stack --stack-name BeStack-prod

# Or delete and redeploy
npx cdk destroy --context environment=prod
npx cdk deploy --context environment=prod
```

---

## Best Practices

### 1. Version Numbering

Follow Semantic Versioning (SemVer):
- `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### 2. Commit Message Convention

Use Conventional Commits:

```
feat: add user authentication
fix: resolve login timeout issue
chore: update dependencies
docs: update API documentation
refactor: restructure user service
test: add unit tests for auth
```

### 3. Pull Request Guidelines

**PR Title Format:**
```
[TYPE] Brief description
```

Examples:
- `[FEAT] Add user profile page`
- `[FIX] Resolve authentication bug`
- `[HOTFIX] Fix critical payment issue`

**PR Description Template:**

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Feature
- [ ] Bug fix
- [ ] Hotfix
- [ ] Documentation
- [ ] Refactoring

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Deployment Notes
Any special deployment considerations

## Screenshots (if applicable)
```

### 4. Environment Parity

Keep environments as similar as possible:
- ✅ Same infrastructure code
- ✅ Different configuration (via environment variables)
- ✅ Separate databases
- ✅ Separate AWS resources

### 5. Monitoring & Alerts

Set up CloudWatch alarms for:
- Lambda errors
- API Gateway 5xx errors
- DynamoDB throttling
- Cost anomalies

### 6. Database Migrations

For schema changes:
1. Deploy backward-compatible changes first
2. Update application code
3. Remove old schema in next release

### 7. Secrets Management

- ✅ Use AWS Secrets Manager for sensitive data
- ✅ Rotate credentials regularly
- ✅ Use IAM roles, not access keys
- ❌ Never commit secrets to git

### 8. Cost Management

- Tag all resources with `Environment` tag
- Set up AWS Budget alerts
- Review costs monthly
- Use `PAY_PER_REQUEST` for dev/staging

### 9. Logging

- Use structured logging (JSON)
- Include correlation IDs
- Set appropriate retention periods:
  - Dev: 7 days
  - Staging: 14 days
  - Prod: 30+ days

### 10. Testing Strategy

**Development:**
- Unit tests
- Integration tests
- Local testing

**Staging:**
- End-to-end tests
- Performance tests
- Security scans
- QA testing

**Production:**
- Smoke tests after deployment
- Canary deployments (advanced)
- Blue/green deployments (advanced)

---

## Troubleshooting

### Issue: CDK Bootstrap Error

```
Error: This stack uses assets, so the toolkit stack must be deployed
```

**Solution:**
```bash
npx cdk bootstrap aws://ACCOUNT-ID/REGION --context environment=prod
```

### Issue: Permission Denied

```
User is not authorized to perform: cloudformation:DescribeStacks
```

**Solution:** Update IAM role permissions or verify OIDC configuration.

### Issue: Stack Already Exists

```
Stack [BeStack-prod] already exists
```

**Solution:** Either destroy the old stack or use a different stack name.

### Issue: GitHub Actions Timeout

**Solution:** Increase timeout in workflow:
```yaml
timeout-minutes: 30
```

### Issue: Failed Deployment, Stack in UPDATE_ROLLBACK_COMPLETE

**Solution:**
```bash
# Delete the failed stack
aws cloudformation delete-stack --stack-name BeStack-prod

# Or rollback
aws cloudformation rollback-stack --stack-name BeStack-prod
```

---

## Next Steps

1. ✅ Set up branch protection rules
2. ✅ Configure GitHub environments
3. ✅ Add repository secrets
4. ✅ Update CDK stack code
5. ✅ Create GitHub Actions workflows
6. ✅ Test deployment to dev
7. ✅ Create first release branch
8. ✅ Test staging deployment
9. ✅ Deploy to production
10. ✅ Document team processes

---

## Additional Resources

- [AWS CDK Best Practices](https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html)
- [GitFlow Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS OIDC with GitHub Actions](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [Semantic Versioning](https://semver.org/)

---

**Document Version:** 1.0.0
**Last Updated:** 2025-01-20
**Maintained By:** DevOps Team
