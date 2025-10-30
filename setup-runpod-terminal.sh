#!/bin/bash
# Setup commands for RunPod Terminal
# Copy and paste these commands into your RunPod web terminal

cat << 'EOF'
# ========================================
# RunPod Setup Commands
# Copy and run each section in RunPod Terminal
# ========================================

# 1. Update and install COLMAP
echo "📦 Installing COLMAP..."
apt-get update
apt-get install -y colmap python3-pip python3-venv git

# 2. Navigate to workspace
cd /workspace

# 3. Clone your repository (if not already there)
git clone https://github.com/marco-interact/colmap-mvp.git || cd colmap-mvp

# 4. Set up Python environment
echo "🐍 Setting up Python environment..."
cd colmap-mvp
python3 -m venv venv
source venv/bin/activate

# 5. Install Python dependencies
echo "📚 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# 6. Create necessary directories
mkdir -p data/results data/cache data/uploads

# 7. Test COLMAP installation
echo "✅ Testing COLMAP..."
colmap -h

# 8. Start the backend service
echo "🚀 Starting backend..."
python main.py

EOF

