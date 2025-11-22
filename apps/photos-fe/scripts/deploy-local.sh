#!/usr/bin/env bash
set -euo pipefail

# Local deployment script for photos-fe
# Mimics the GitHub Actions workflow
#
# Usage: ./scripts/deploy-local.sh [environment]
# Example: ./scripts/deploy-local.sh dev

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(cd "$PROJECT_DIR/../.." && pwd)"

# Load .env file if it exists
if [ -f "$PROJECT_DIR/.env" ]; then
  echo "Loading .env file..."
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

# Environment can be passed as argument or from .env
ENVIRONMENT="${1:-${ENVIRONMENT:-dev}}"

echo "========================================"
echo "Deploying photos-fe to $ENVIRONMENT"
echo "========================================"

# Step 1: Fetch backend outputs
echo ""
echo "Step 1: Fetching backend stack outputs..."
OUTPUT_FILE="$PROJECT_DIR/api-stack.outputs.json" \
  "$REPO_ROOT/.github/scripts/fetch-backend-outputs.sh" "$ENVIRONMENT"

# Extract values for build
API_URL=$(jq -r '.ApiEndpoint' "$PROJECT_DIR/api-stack.outputs.json")
USER_POOL_ID=$(jq -r '.UserPoolId' "$PROJECT_DIR/api-stack.outputs.json")
USER_POOL_CLIENT_ID=$(jq -r '.UserPoolClientId' "$PROJECT_DIR/api-stack.outputs.json")

# Step 2: Build frontend
echo ""
echo "Step 2: Building frontend..."
cd "$REPO_ROOT"
VITE_API_URL="$API_URL" \
VITE_USER_POOL_ID="$USER_POOL_ID" \
VITE_USER_POOL_CLIENT_ID="$USER_POOL_CLIENT_ID" \
  npx nx build photos-fe

# Step 3: Synthesize CDK
echo ""
echo "Step 3: Deploy CDK..."
cd "$PROJECT_DIR"
cdk deploy \
  --context environment="$ENVIRONMENT" \
  --context domainName="${DOMAIN_NAME:-}" \
  --context hostedZoneId="${HOSTED_ZONE_ID:-}" \
  --context hostedZoneName="${HOSTED_ZONE_NAME:-}" \
  --context certificateArn="${CERTIFICATE_ARN:-}" \
  --verbose

# Step 4: Deploy

# Show results
echo ""
echo "========================================"
echo "Deployment complete!"
echo "========================================"
WEBSITE_URL=$(jq -r '."social-app-'$ENVIRONMENT'-website".WebsiteUrl' outputs.json 2>/dev/null || echo "Check outputs.json for URL")
echo "Website URL: $WEBSITE_URL"
