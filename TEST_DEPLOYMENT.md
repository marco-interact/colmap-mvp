# 🧪 Testing Your COLMAP MVP Deployment

## 📋 Your Services

- **Frontend**: https://p01--colmap-frontend--xf7lzhrl47hj.code.run
- **Backend**: https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run

---

## ✅ Step 1: Test Backend API

### Check Health Endpoint
```bash
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "colmap-worker",
  "gpu_available": true,  ← Must be true!
  "active_jobs": 0,
  "memory_usage": "XXX MB"
}
```

### Check API Documentation
Open in browser:
```
https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/docs
```

You should see the FastAPI interactive documentation!

---

## ✅ Step 2: Test Frontend

### Open Frontend
```
https://p01--colmap-frontend--xf7lzhrl47hj.code.run
```

**What you should see:**
- COLMAP Dashboard loads
- No errors in browser console
- UI looks correct

### Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors
4. Should see successful API connection

---

## ✅ Step 3: Test Full Integration

### Upload a Test Video

1. Go to frontend: https://p01--colmap-frontend--xf7lzhrl47hj.code.run
2. Click "Upload Video" or similar button
3. Select a short test video (< 1 minute, < 50MB)
4. Submit for processing

### Monitor Processing

Watch the backend logs in Northflank:
```
Starting video upload and processing job...
GPU detected: NVIDIA A100
Extracting frames from video...
Running feature extraction...
```

---

## 🐛 Common Issues & Fixes

### Issue 1: Backend shows `gpu_available: false`

**Check:**
```bash
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/health | jq .gpu_available
```

**If false:**
- Verify GPU instance is running (not CPU)
- Check Northflank service settings
- Restart the backend service

### Issue 2: Frontend can't connect to backend

**Symptoms:**
- CORS errors in console
- Network errors
- "Failed to fetch"

**Fix:**
Check environment variable in frontend service:
```
NEXT_PUBLIC_API_URL=https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run
```

### Issue 3: Frontend shows 404

**Fix:**
- Check frontend build logs
- Verify `output: 'standalone'` in next.config.js
- Rebuild frontend service

---

## 📊 Performance Benchmarks

### Backend (A100 GPU)
- Health check: < 100ms
- Frame extraction: 1-2 seconds
- Feature detection: 30-60 seconds (50 frames)
- Full pipeline: 3-6 minutes (medium quality)

### Frontend
- Page load: < 2 seconds
- API calls: 100-500ms
- File upload: Depends on file size

---

## 🔍 Detailed Testing

### Test 1: Backend Health
```bash
curl -X GET https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/health
```

### Test 2: Create User
```bash
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/users \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```

### Test 3: Upload Video (replace with actual file)
```bash
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/upload-video \
  -F "video=@test-video.mp4" \
  -F "project_id=test-001" \
  -F "scan_name=Test Scan" \
  -F "quality=low" \
  -F "user_email=test@example.com"
```

**Response:**
```json
{
  "job_id": "uuid-here",
  "scan_id": "scan-uuid",
  "status": "pending",
  "message": "Video uploaded successfully"
}
```

### Test 4: Check Job Status
```bash
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/jobs/JOB_ID
```

---

## 📈 Success Criteria

### ✅ Backend Working
- [x] Health endpoint returns 200
- [x] `gpu_available: true`
- [x] API docs accessible
- [x] Can create users
- [x] Can upload videos

### ✅ Frontend Working
- [x] Page loads without errors
- [x] UI renders correctly
- [x] Can navigate pages
- [x] Can upload files
- [x] Shows processing status

### ✅ Integration Working
- [x] Frontend connects to backend
- [x] No CORS errors
- [x] Video uploads successfully
- [x] Processing starts
- [x] Status updates appear
- [x] 3D models display when complete

---

## 🎯 Quick Test Script

Save this as `test-deployment.sh`:

```bash
#!/bin/bash

BACKEND="https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run"
FRONTEND="https://p01--colmap-frontend--xf7lzhrl47hj.code.run"

echo "🔍 Testing COLMAP MVP Deployment"
echo "================================"

# Test 1: Backend Health
echo -e "\n✓ Testing Backend Health..."
curl -s $BACKEND/health | jq .

# Test 2: GPU Check
echo -e "\n✓ Checking GPU..."
GPU=$(curl -s $BACKEND/health | jq -r .gpu_available)
if [ "$GPU" == "true" ]; then
    echo "✅ GPU is available!"
else
    echo "❌ GPU not detected!"
fi

# Test 3: Frontend
echo -e "\n✓ Testing Frontend..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND)
if [ "$STATUS" == "200" ]; then
    echo "✅ Frontend is running!"
else
    echo "❌ Frontend returned $STATUS"
fi

# Test 4: API Docs
echo -e "\n✓ Testing API Docs..."
DOCS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND/docs)
if [ "$DOCS" == "200" ]; then
    echo "✅ API docs accessible!"
else
    echo "❌ API docs returned $DOCS"
fi

echo -e "\n🎉 Testing Complete!"
echo "Frontend: $FRONTEND"
echo "Backend: $BACKEND"
```

---

## 🚀 Next Steps

1. **Test Backend**: Run health check
2. **Test Frontend**: Open in browser
3. **Upload Video**: Try small test video
4. **Monitor Logs**: Watch processing in Northflank
5. **View Results**: Check 3D model when complete

---

**Your deployment is ready! Start testing now!** 🎉

