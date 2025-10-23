#!/bin/bash
set -e

echo "🚀 Starting COLMAP Frontend..."
echo "📍 Current directory: $(pwd)"
echo "📦 Node version: $(node --version 2>&1 || echo 'Node not found')"
echo "📦 NPM version: $(npm --version 2>&1 || echo 'NPM not found')"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ node_modules found"
    ls -la node_modules/.bin/ | head -5
else
    echo "❌ node_modules NOT found"
    echo "📂 Directory contents:"
    ls -la
    
    echo "🔧 Installing dependencies..."
    npm install --production
fi

# Check if .next exists
if [ -d ".next" ]; then
    echo "✅ .next build directory found"
else
    echo "❌ .next NOT found - running build..."
    npm run build
fi

echo "🎯 Starting Next.js server on port ${PORT:-3000}"

# Try different methods to start Next.js
if [ -f "node_modules/.bin/next" ]; then
    echo "✅ Using node_modules/.bin/next"
    exec node_modules/.bin/next start -p ${PORT:-3000}
elif command -v npx &> /dev/null; then
    echo "✅ Using npx"
    exec npx next start -p ${PORT:-3000}
elif command -v next &> /dev/null; then
    echo "✅ Using global next"
    exec next start -p ${PORT:-3000}
else
    echo "❌ Cannot find Next.js binary!"
    echo "🔍 Searching for next..."
    find . -name "next" -type f 2>/dev/null || echo "Not found"
    exit 1
fi

