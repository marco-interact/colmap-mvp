#!/bin/bash

BACKEND="https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run"
FRONTEND="https://p01--colmap-frontend--xf7lzhrl47hj.code.run"

echo "🔍 Testing COLMAP MVP Deployment"
echo "================================"

# Test 1: Backend Health
echo -e "\n✓ Testing Backend Health..."
curl -s $BACKEND/health | python3 -m json.tool 2>/dev/null || curl -s $BACKEND/health

# Test 2: GPU Check
echo -e "\n✓ Checking GPU..."
curl -s $BACKEND/health | grep -o '"gpu_available":[^,]*' || echo "Checking GPU status..."

# Test 3: Frontend
echo -e "\n✓ Testing Frontend..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND)
if [ "$STATUS" == "200" ]; then
    echo "✅ Frontend is running! ($STATUS)"
else
    echo "❌ Frontend returned $STATUS"
fi

# Test 4: API Docs
echo -e "\n✓ Testing API Docs..."
DOCS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND/docs)
if [ "$DOCS" == "200" ]; then
    echo "✅ API docs accessible! ($DOCS)"
else
    echo "⚠️  API docs returned $DOCS"
fi

echo -e "\n================================"
echo "🎉 Testing Complete!"
echo ""
echo "📱 Frontend: $FRONTEND"
echo "⚙️  Backend:  $BACKEND"
echo "📚 API Docs: $BACKEND/docs"
echo ""
echo "Next: Open frontend in your browser!"
