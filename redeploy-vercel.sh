#!/bin/bash

export VERCEL_TOKEN="ycSDrQ8tYp4L6Z0qFfOK4igb"
export VERCEL_ORG_ID="team_PWckdPO4Vl3C1PWOA9qs9DrI"
export VERCEL_PROJECT_ID="prj_pWPdNcXNWyzQaaDysmBGMiU15AB1"

echo "🚀 Triggering Vercel redeploy..."

RESPONSE=$(curl -s -X POST \
  "https://api.vercel.com/v13/deployments?teamId=$VERCEL_ORG_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$VERCEL_PROJECT_ID\",
    \"project\": \"$VERCEL_PROJECT_ID\",
    \"target\": \"production\",
    \"forceNew\": true
  }")

URL=$(echo "$RESPONSE" | jq -r '.urls.production // .urls[0] // "pending"')
echo "✅ Deployment URL: https://$URL"

