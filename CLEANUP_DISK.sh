#!/bin/bash
# Quick disk cleanup script

echo "🧹 Starting disk cleanup..."
echo ""

# 1. Clean Docker (can free 5-20GB)
echo "1️⃣ Cleaning Docker..."
docker system prune -a -f --volumes 2>/dev/null || echo "Docker cleanup skipped"
echo ""

# 2. Clean Homebrew cache (can free 2-10GB)
echo "2️⃣ Cleaning Homebrew cache..."
brew cleanup --prune=all 2>/dev/null || echo "Homebrew cleanup skipped"
echo ""

# 3. Clean npm cache (can free 1-5GB)
echo "3️⃣ Cleaning npm cache..."
npm cache clean --force 2>/dev/null || echo "npm cleanup skipped"
echo ""

# 4. Clean Python caches
echo "4️⃣ Cleaning Python caches..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -name "*.pyc" -delete 2>/dev/null
echo ""

# 5. Clean system logs (can free 1-3GB)
echo "5️⃣ Cleaning system logs..."
sudo rm -rf /private/var/log/* 2>/dev/null || echo "Log cleanup needs sudo"
echo ""

# 6. Empty trash (can free varies)
echo "6️⃣ Emptying Trash..."
rm -rf ~/.Trash/* 2>/dev/null
echo ""

# 7. Clean Xcode caches if installed (can free 10-50GB!)
echo "7️⃣ Cleaning Xcode caches..."
rm -rf ~/Library/Developer/Xcode/DerivedData/* 2>/dev/null
rm -rf ~/Library/Caches/com.apple.dt.Xcode/* 2>/dev/null
echo ""

echo "✅ Cleanup complete!"
echo ""
df -h / | tail -1

