#!/usr/bin/env bash
set -euo pipefail

# Fetch backend CloudFormation stack outputs
# Usage: ./fetch-backend-outputs.sh <environment>
# Outputs: Sets GITHUB_OUTPUT variables if running in CI, otherwise prints to stdout

ENVIRONMENT="${1:-dev}"
STACK_NAME="social-app-${ENVIRONMENT}"

echo "Fetching outputs from stack: $STACK_NAME"

# Function to fetch a CloudFormation output value
fetch_output() {
  local output_key="$1"
  aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='$output_key'].OutputValue" \
    --output text 2>/dev/null || echo ""
}

# Fetch all required outputs
API_URL=$(fetch_output "ApiEndpoint")
USER_POOL_ID=$(fetch_output "UserPoolId")
USER_POOL_CLIENT_ID=$(fetch_output "UserPoolClientId")

# Validate and warn for missing values
if [ -z "$API_URL" ]; then
  echo "Warning: Could not fetch API URL from backend stack."
  API_URL=""
fi

if [ -z "$USER_POOL_ID" ]; then
  echo "Warning: Could not fetch UserPoolId from backend stack."
  USER_POOL_ID=""
fi

if [ -z "$USER_POOL_CLIENT_ID" ]; then
  echo "Warning: Could not fetch UserPoolClientId from backend stack."
  USER_POOL_CLIENT_ID=""
fi

echo "Backend API URL: $API_URL"
echo "User Pool ID: $USER_POOL_ID"
echo "User Pool Client ID: $USER_POOL_CLIENT_ID"

# Output for GitHub Actions
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "API_URL=$API_URL" >> "$GITHUB_OUTPUT"
  echo "USER_POOL_ID=$USER_POOL_ID" >> "$GITHUB_OUTPUT"
  echo "USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID" >> "$GITHUB_OUTPUT"
fi

# Output JSON file if OUTPUT_FILE is set
if [ -n "${OUTPUT_FILE:-}" ]; then
  cat > "$OUTPUT_FILE" << EOF
{
  "ApiEndpoint": "$API_URL",
  "UserPoolId": "$USER_POOL_ID",
  "UserPoolClientId": "$USER_POOL_CLIENT_ID",
  "environment": "$ENVIRONMENT"
}
EOF
fi

echo "$API_URL"
