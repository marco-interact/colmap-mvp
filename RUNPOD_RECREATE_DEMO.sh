#!/bin/bash
# RunPod Script to Recreate Demo Data

echo "🔄 Recreating demo data on RunPod..."
echo ""

# Navigate to project directory
cd /workspace/colmap-mvp

# Make sure backend is running
echo "📋 Checking if backend is running..."
BACKEND_PID=$(pgrep -f "python.*main.py")

if [ -z "$BACKEND_PID" ]; then
    echo "⚠️  Backend not running, starting it..."
    source venv/bin/activate
    nohup python main.py > backend.log 2>&1 &
    sleep 5
else
    echo "✅ Backend is running (PID: $BACKEND_PID)"
fi

# Get the Cloudflare tunnel URL (or backend URL)
echo ""
echo "📡 Getting backend URL..."
BACKEND_URL="http://localhost:8000"

# Trigger demo data recreation
echo ""
echo "🔄 Triggering demo data recreation..."
echo "Calling: ${BACKEND_URL}/database/setup-demo"

response=$(curl -s -X POST "${BACKEND_URL}/database/setup-demo")

echo "Response:"
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"

# Wait a moment
sleep 2

# Verify demo data was created
echo ""
echo "🔍 Verifying demo data..."
projects=$(curl -s "${BACKEND_URL}/api/projects")

echo "Projects:"
echo "$projects" | python3 -m json.tool 2>/dev/null || echo "$projects"

# Get scans
if [ ! -z "$projects" ]; then
    project_id=$(echo "$projects" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['projects'][0]['id'])" 2>/dev/null)
    if [ ! -z "$project_id" ]; then
        echo ""
        echo "📊 Getting scans for project: $project_id"
        scans=$(curl -s "${BACKEND_URL}/api/projects/${project_id}/scans")
        echo "Scans:"
        echo "$scans" | python3 -m json.tool 2>/dev/null || echo "$scans"
    fi
fi

echo ""
echo "✅ Done! Demo data should now be available."

