#!/usr/bin/env bash
set -euo pipefail

# Check if a project is affected by changes
# Usage: ./check-affected.sh <project> <base_sha> <head_sha>
# Outputs: Sets 'affected=true/false' in GITHUB_OUTPUT

PROJECT="${1:?Project name required}"
BASE="${2:?Base SHA required}"
HEAD="${3:?Head SHA required}"

echo "Checking if '$PROJECT' project is affected..."
echo "Base: $BASE"
echo "Head: $HEAD"

# Check if project or its dependencies are affected
if npx nx show project "$PROJECT" --affected --base="$BASE" --head="$HEAD" > /dev/null 2>&1; then
  echo "✅ $PROJECT is affected by changes"
  AFFECTED="true"
else
  echo "⏭️  $PROJECT is not affected by changes - skipping deployment"
  AFFECTED="false"
fi

# Output for GitHub Actions
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "affected=$AFFECTED" >> "$GITHUB_OUTPUT"
fi

echo "$AFFECTED"
