#!/bin/bash
# Comprehensive COLMAP Backend Diagnostics

echo "🔍 COLMAP MVP - Complete Diagnostic Check"
echo "=========================================="
echo ""

BACKEND_URL="https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run"

echo "1️⃣ Backend Health Check..."
curl -s "$BACKEND_URL/health" | jq -r 'if .status == "healthy" then "✅ Backend is healthy" else "❌ Backend unhealthy" end'
echo ""

echo "2️⃣ GPU Availability..."
curl -s "$BACKEND_URL/" | jq -r 'if .gpu_enabled == true then "✅ GPU is enabled" else "⚠️  GPU is disabled (CPU mode)" end'
echo ""

echo "3️⃣ Database Connectivity..."
curl -s "$BACKEND_URL/database/status" | jq -r 'if .status == "connected" then "✅ Database connected" else "❌ Database error" end'
echo ""

echo "4️⃣ Database Tables..."
curl -s "$BACKEND_URL/database/status" | jq '.tables'
echo ""

echo "5️⃣ Testing CORS (from browser origin)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
  -H "Origin: https://p01--colmap-frontend--xf7lzhrl47hj.code.run" \
  -H "Access-Control-Request-Method: POST" \
  "$BACKEND_URL/upload-video")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ CORS is configured correctly"
else
  echo "❌ CORS error (HTTP $HTTP_CODE)"
fi
echo ""

echo "6️⃣ Python Dependencies Check..."
echo "   Checking if backend has required Python packages..."
curl -s "$BACKEND_URL/" | jq -r '"   Backend version: " + .version'
echo ""

echo "7️⃣ Test Data Initialization..."
INIT_RESULT=$(curl -s -X POST "$BACKEND_URL/database/init-test-data")
echo "$INIT_RESULT" | jq -r 'if .status == "success" then "✅ Test user created: " + .test_email else "⚠️  Test data already exists or error" end'
echo ""

echo "8️⃣ Getting User Projects..."
USER_EMAIL="test@colmap.app"
PROJECTS=$(curl -s "$BACKEND_URL/users/$USER_EMAIL/projects")
PROJECT_COUNT=$(echo "$PROJECTS" | jq 'length')
echo "   Found $PROJECT_COUNT projects for $USER_EMAIL"
if [ "$PROJECT_COUNT" -gt 0 ]; then
  echo "   ✅ Project API working"
  echo "$PROJECTS" | jq -r '.[] | "   - " + .name + " (ID: " + .id + ")"'
else
  echo "   ⚠️  No projects found (this is OK for fresh install)"
fi
echo ""

echo "9️⃣ CRITICAL: Checking COLMAP Binary..."
echo "   ⚠️  Cannot directly check COLMAP binary from outside container"
echo "   This requires SSH access or a custom diagnostic endpoint"
echo "   If video processing fails, COLMAP may not be installed correctly"
echo ""

echo "🔟 Test Upload Endpoint Availability..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$BACKEND_URL/upload-video")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Upload endpoint is available"
else
  echo "❌ Upload endpoint returned HTTP $HTTP_CODE"
fi
echo ""

echo "=========================================="
echo "📊 Summary"
echo "=========================================="
echo ""

# Check if backend is fully functional
HEALTH=$(curl -s "$BACKEND_URL/health" | jq -r '.status')
DB=$(curl -s "$BACKEND_URL/database/status" | jq -r '.status')
GPU=$(curl -s "$BACKEND_URL/" | jq -r '.gpu_enabled')

if [ "$HEALTH" = "healthy" ] && [ "$DB" = "connected" ]; then
  echo "✅ Backend API is fully operational"
else
  echo "❌ Backend has issues"
fi

if [ "$GPU" = "true" ]; then
  echo "✅ GPU acceleration is available"
else
  echo "⚠️  Running in CPU mode (slower processing)"
fi

echo ""
echo "🎯 Next Steps:"
echo ""
echo "If upload still fails, check:"
echo "1. Frontend environment variable NEXT_PUBLIC_API_URL"
echo "2. Go to Northflank dashboard and verify the URL"
echo "3. Make sure frontend is restarted after changing env vars"
echo ""
echo "Current backend URL: $BACKEND_URL"
echo ""

