#!/bin/bash
# Test CORS and Backend Connectivity

echo "🔍 Testing Backend Health..."
curl -s https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/health | jq .

echo ""
echo "🔍 Testing CORS Headers..."
curl -I -X OPTIONS \
  -H "Origin: https://p01--colmap-frontend--xf7lzhrl47hj.code.run" \
  -H "Access-Control-Request-Method: POST" \
  https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/upload-video

echo ""
echo "✅ If you see 'Access-Control-Allow-Origin: *' above, CORS is working!"

