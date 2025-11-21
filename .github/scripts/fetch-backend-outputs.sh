#!/usr/bin/env bash
set -euo pipefail

# Fetch backend CloudFormation stack outputs
# Usage: ./fetch-backend-outputs.sh <environment>
# Outputs: Sets GITHUB_OUTPUT variables if running in CI, otherwise prints to stdout

ENVIRONMENT="${1:-dev}"
STACK_NAME="social-app-${ENVIRONMENT}"

echo "Fetching outputs from stack: $STACK_NAME"

# Get API endpoint from backend stack
API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
  --output text 2>/dev/null || echo "")

if [ -z "$API_URL" ]; then
  echo "Warning: Could not fetch API URL from backend stack. Using placeholder."
  API_URL="https://api-placeholder.example.com"
fi

echo "Backend API URL: $API_URL"

# Output for GitHub Actions
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "API_URL=$API_URL" >> "$GITHUB_OUTPUT"
fi

# Output JSON file if OUTPUT_FILE is set
if [ -n "${OUTPUT_FILE:-}" ]; then
  echo "{\"UserPoolClientId\": \"$API_URL\", \"UserPoolId\": \"$API_URL\", \"ApiEndpoint\": \"$API_URL\", \"environment\": \"$ENVIRONMENT\" }" > "$OUTPUT_FILE"
fi

echo "$API_URL"
