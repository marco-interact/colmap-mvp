#!/bin/bash
# Deep diagnostic - check everything

echo "🔍 DEEP DIAGNOSTIC CHECK"
echo "========================"
echo ""

BACKEND="https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run"
FRONTEND="https://p01--colmap-frontend--xf7lzhrl47hj.code.run"

echo "1️⃣ Testing Frontend is up..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend is up (HTTP $FRONTEND_STATUS)"
else
    echo "❌ Frontend returned HTTP $FRONTEND_STATUS"
fi
echo ""

echo "2️⃣ Testing Backend is up..."
BACKEND_STATUS=$(curl -s "$BACKEND/health" | jq -r '.status')
if [ "$BACKEND_STATUS" = "healthy" ]; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend status: $BACKEND_STATUS"
fi
echo ""

echo "3️⃣ Checking what URL frontend HTML contains..."
curl -s "$FRONTEND" | grep -o "colmap-worker-[a-z]*" | head -1 || echo "⚠️  Can't detect URL in HTML"
echo ""

echo "4️⃣ Getting a project for testing..."
PROJECT_ID=$(curl -s "$BACKEND/users/test@colmap.app/projects" | jq -r '.[0].id')
echo "Project ID: $PROJECT_ID"
echo ""

echo "5️⃣ Checking if backend has real processing capacity..."
echo "Creating a test scan record..."
curl -s "$BACKEND/database/status" | jq '{users: .tables.users, projects: .tables.projects, scans: .tables.scans}'
echo ""

echo "6️⃣ Testing if we can create a project..."
TEST_PROJECT=$(curl -s -X POST "$BACKEND/projects" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "user_email=test@colmap.app&name=Diagnostic%20Test&description=Test&location=Test&space_type=indoor&project_type=architecture" | jq -r '.project_id')
echo "Created test project: $TEST_PROJECT"
echo ""

echo "7️⃣ Checking all available endpoints..."
curl -s "$BACKEND/openapi.json" | jq -r '.paths | keys[]' | head -15
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 CRITICAL QUESTION:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Can you:"
echo "1. Open your browser DevTools (F12)"
echo "2. Go to Console tab"
echo "3. Look for 'Worker URL Configuration' log"
echo "4. Copy what URL it shows"
echo ""
echo "Also check Network tab:"
echo "1. Try to upload something"
echo "2. Look for failed requests"
echo "3. What URL is it trying to reach?"
echo ""
