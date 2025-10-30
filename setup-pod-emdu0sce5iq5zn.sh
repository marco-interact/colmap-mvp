#!/bin/bash
set -e

echo "🚀 Setting up new pod: emdu0sce5iq5zn"
echo "======================================"

# 1. Check if volume is mounted
echo ""
echo "1️⃣ Checking volume mount..."
if mount | grep -q "/workspace"; then
    echo "✅ Volume mounted at /workspace"
else
    echo "⚠️  No volume mounted at /workspace"
fi
df -h /workspace

# 2. Clone/pull latest code
echo ""
echo "2️⃣ Setting up code..."
cd /workspace

if [ -d "colmap-mvp" ]; then
    echo "Updating existing repo..."
    cd colmap-mvp
    git fetch origin
    git reset --hard origin/main
else
    echo "Cloning repo..."
    git clone https://github.com/marco-interact/colmap-mvp.git
    cd colmap-mvp
fi

# 3. Setup Python environment
echo ""
echo "3️⃣ Setting up Python environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt > /dev/null 2>&1

# 4. Install COLMAP
echo ""
echo "4️⃣ Checking COLMAP..."
if command -v colmap &> /dev/null; then
    echo "✅ COLMAP already installed"
else
    echo "Installing COLMAP..."
    bash runpod-install-colmap.sh
fi

# 5. Initialize database
echo ""
echo "5️⃣ Initializing database and demo data..."
pkill -f "python.*main.py" || true

# Start backend to trigger init
nohup python main.py > backend.log 2>&1 &
sleep 8

echo "Checking logs..."
tail -n 50 backend.log | grep -E "(initialized|projects|scans|ERROR|Demo)"

# 6. Verify backend
echo ""
echo "6️⃣ Verifying backend..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend healthy"
    curl -s http://localhost:8000/health | jq -r '.message'
else
    echo "❌ Backend not responding"
fi

# 7. Check demo data
echo ""
echo "7️⃣ Checking demo data..."
PROJECTS=$(curl -s http://localhost:8000/api/projects)
PROJECT_COUNT=$(echo "$PROJECTS" | jq -r '.projects | length')
echo "Projects: $PROJECT_COUNT"

if [ "$PROJECT_COUNT" -gt 0 ]; then
    echo "✅ Demo data exists"
    echo "$PROJECTS" | jq -r '.projects[0] | {id, name}'
else
    echo "❌ No demo projects found"
fi

# 8. Setup Cloudflare tunnel
echo ""
echo "8️⃣ Setting up Cloudflare tunnel..."
pkill -f cloudflared || true
nohup cloudflared tunnel --url http://localhost:8000 --protocol quic > /tmp/cloudflared.log 2>&1 &
sleep 10

TUNNEL_URL=$(grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' /tmp/cloudflared.log | head -1)

if [ -n "$TUNNEL_URL" ]; then
    echo "✅ Tunnel active: $TUNNEL_URL"
else
    echo "❌ Tunnel failed to start"
    tail -n 20 /tmp/cloudflared.log
fi

echo ""
echo "======================================"
echo "🎉 Setup complete!"
echo ""
echo "Backend: http://localhost:8000"
echo "Tunnel:  $TUNNEL_URL"
echo ""
echo "📋 Next step: Update Vercel with tunnel URL"

