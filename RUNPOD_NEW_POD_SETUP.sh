#!/bin/bash

echo "🚀 Setting up RunPod pod t2tuuwh2z4hrlz..."

# 1. Verify workspace and clone repo
echo "📦 Checking /workspace..."
ls -la /workspace

echo "📥 Cloning repository..."
cd /workspace
if [ -d "colmap-mvp" ]; then
    echo "Directory exists, pulling latest..."
    cd colmap-mvp
    git fetch origin && git reset --hard origin/main
else
    git clone https://github.com/marco-interact/colmap-mvp.git
    cd colmap-mvp
fi

# 2. Install Python dependencies
echo "🔧 Setting up Python environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 3. Install COLMAP if not installed
echo "🔧 Checking COLMAP installation..."
if ! command -v colmap &> /dev/null; then
    echo "Installing COLMAP..."
    bash runpod-install-colmap.sh
fi

# 4. Initialize database and demo data
echo "🗄️  Initializing database..."
source venv/bin/activate
python -c "
from main import init_database, create_demo_data
init_database()
result = create_demo_data()
print('Demo data result:', result)
"

# 5. Start backend
echo "🚀 Starting backend..."
pkill -f "python.*main.py" || true
nohup python main.py > backend.log 2>&1 &
sleep 6

# 6. Verify
echo "✅ Verification:"
echo "Backend health:"
curl -s http://localhost:8000/health

echo -e "\nProjects:"
curl -s http://localhost:8000/api/projects

# 7. Setup Cloudflare tunnel
echo -e "\n🌐 Setting up Cloudflare tunnel..."
pkill -f cloudflared || true
nohup cloudflared tunnel --url http://localhost:8000 --protocol quic > /tmp/cloudflared.log 2>&1 &
sleep 8
URL=$(grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' /tmp/cloudflared.log | head -1)
echo "Cloudflare tunnel URL: $URL"

echo -e "\n🎉 Setup complete!"
echo "Backend running on: http://localhost:8000"
echo "Tunnel URL: $URL"

