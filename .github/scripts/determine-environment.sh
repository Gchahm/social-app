#!/usr/bin/env bash
set -euo pipefail

# Determine deployment environment from git ref
# Usage: ./determine-environment.sh <event_name> <github_ref>
# Outputs: Sets 'environment' and 'should-deploy' in GITHUB_OUTPUT

EVENT_NAME="${1:?Event name required}"
GITHUB_REF="${2:?GitHub ref required}"

echo "Event: $EVENT_NAME"
echo "Ref: $GITHUB_REF"

# Don't deploy on PRs
if [[ "$EVENT_NAME" == "pull_request" ]]; then
  ENVIRONMENT="dev"
  SHOULD_DEPLOY="false"
  echo "Pull request - will not deploy"
# Determine environment based on branch
elif [[ "$GITHUB_REF" == refs/heads/main ]]; then
  ENVIRONMENT="prod"
  SHOULD_DEPLOY="true"
  echo "Deploying to PRODUCTION"
elif [[ "$GITHUB_REF" == refs/heads/release/* ]]; then
  ENVIRONMENT="staging"
  SHOULD_DEPLOY="true"
  echo "Deploying to STAGING"
elif [[ "$GITHUB_REF" == refs/heads/develop ]]; then
  ENVIRONMENT="dev"
  SHOULD_DEPLOY="true"
  echo "Deploying to DEVELOPMENT"
else
  ENVIRONMENT="dev"
  SHOULD_DEPLOY="false"
  echo "Unknown branch - will not deploy"
fi

# Output for GitHub Actions
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "environment=$ENVIRONMENT" >> "$GITHUB_OUTPUT"
  echo "should-deploy=$SHOULD_DEPLOY" >> "$GITHUB_OUTPUT"
fi

echo "$ENVIRONMENT $SHOULD_DEPLOY"
