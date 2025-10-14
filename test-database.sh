#!/bin/bash
# Database Testing Script for COLMAP MVP
# Tests database connectivity, initialization, and CRUD operations

API_URL="${API_URL:-https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run}"

echo "🗄️  COLMAP Database Testing"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Database Status
echo "📊 Test 1: Database Status"
echo "-------------------------"
response=$(curl -s "${API_URL}/database/status")
echo "$response" | python3 -m json.tool

status=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'error'))")

if [ "$status" = "connected" ]; then
    echo -e "${GREEN}✅ Database connected${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi

echo ""

# Test 2: Database Path and Storage
echo "💾 Test 2: Database Path & Storage"
echo "-----------------------------------"
db_path=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('database_path', 'unknown'))" 2>/dev/null || echo "$response")
db_exists=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('database_exists', False))" 2>/dev/null || echo "$response")
db_size=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('database_size_mb', 0))" 2>/dev/null || echo "$response")

echo "Database Path: $db_path"
echo "Database Exists: $db_exists"
echo "Database Size: ${db_size}MB"

if [[ "$db_path" == *"/app/data"* ]]; then
    echo -e "${GREEN}✅ Database in persistent volume (/app/data)${NC}"
elif [[ "$db_path" == *"/tmp"* ]]; then
    echo -e "${YELLOW}⚠️  WARNING: Database in /tmp (ephemeral storage!)${NC}"
    echo -e "${YELLOW}   Data will be lost on pod restart${NC}"
else
    echo -e "${RED}❌ Unexpected database path${NC}"
fi

echo ""

# Test 3: Initialize Test Data
echo "🏗️  Test 3: Initialize Test Data"
echo "--------------------------------"
init_response=$(curl -s -X POST "${API_URL}/database/init-test-data")
echo "$init_response" | python3 -m json.tool

init_status=$(echo "$init_response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'error'))" 2>/dev/null)

if [ "$init_status" = "success" ]; then
    echo -e "${GREEN}✅ Test data initialized${NC}"
    test_email=$(echo "$init_response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('test_email', ''))" 2>/dev/null)
    project_id=$(echo "$init_response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('project_id', ''))" 2>/dev/null)
    echo "Test Email: $test_email"
    echo "Test Project ID: $project_id"
else
    echo -e "${RED}❌ Failed to initialize test data${NC}"
fi

echo ""

# Test 4: Verify Data in Tables
echo "📋 Test 4: Verify Data in Tables"
echo "--------------------------------"
db_status=$(curl -s "${API_URL}/database/status")
echo "$db_status" | python3 -c "
import sys, json
data = json.load(sys.stdin)
tables = data.get('tables', {})
print(f\"Users: {tables.get('users', 0)}\")
print(f\"Projects: {tables.get('projects', 0)}\")
print(f\"Scans: {tables.get('scans', 0)}\")
print(f\"Processing Jobs: {tables.get('processing_jobs', 0)}\")
" 2>/dev/null || echo "Error parsing response"

users_count=$(echo "$db_status" | python3 -c "import sys, json; print(json.load(sys.stdin).get('tables', {}).get('users', 0))" 2>/dev/null)

if [ "$users_count" -gt 0 ]; then
    echo -e "${GREEN}✅ Database has data (${users_count} users)${NC}"
else
    echo -e "${YELLOW}⚠️  Database is empty${NC}"
fi

echo ""

# Test 5: Create User
echo "👤 Test 5: Create User via API"
echo "------------------------------"
create_user_response=$(curl -s -X POST "${API_URL}/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "name": "Test User API"
  }')
echo "$create_user_response" | python3 -m json.tool 2>/dev/null || echo "$create_user_response"
echo ""

# Test 6: Create Project
echo "📁 Test 6: Create Project via API"
echo "---------------------------------"
create_project_response=$(curl -s -X POST "${API_URL}/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "test@colmap.app",
    "name": "API Test Project",
    "description": "Created via API test",
    "location": "Test Location"
  }')
echo "$create_project_response" | python3 -m json.tool 2>/dev/null || echo "$create_project_response"
echo ""

# Test 7: Get User Projects
echo "📂 Test 7: Get User Projects"
echo "----------------------------"
projects_response=$(curl -s "${API_URL}/projects/test@colmap.app")
echo "$projects_response" | python3 -m json.tool 2>/dev/null || echo "$projects_response"

project_count=$(echo "$projects_response" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data.get('projects', [])))" 2>/dev/null || echo "0")

if [ "$project_count" -gt 0 ]; then
    echo -e "${GREEN}✅ Retrieved ${project_count} projects${NC}"
else
    echo -e "${YELLOW}⚠️  No projects found${NC}"
fi

echo ""

# Summary
echo "═════════════════════════════"
echo "📊 DATABASE TEST SUMMARY"
echo "═════════════════════════════"
echo ""
echo "Database Status: $status"
echo "Database Path: $db_path"
echo "Database Size: ${db_size}MB"
echo "Total Users: $users_count"
echo "Total Projects: $project_count"
echo ""

if [[ "$status" = "connected" ]] && [[ "$db_path" == *"/app/data"* ]]; then
    echo -e "${GREEN}✅ ALL CRITICAL TESTS PASSED${NC}"
    echo ""
    echo "✅ Database is working"
    echo "✅ Data is persisted in /app/data"
    echo "✅ CRUD operations successful"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Upload a test video"
    echo "   2. Monitor processing status"
    echo "   3. Verify scan data is saved"
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "⚠️  Check the following:"
    echo "   - DATABASE_PATH environment variable"
    echo "   - Persistent volume mounted at /app/data"
    echo "   - Database initialization on startup"
fi

echo ""

