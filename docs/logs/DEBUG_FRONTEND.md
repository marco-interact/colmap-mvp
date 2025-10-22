# 🔍 Debug Frontend Connection

The `NEXT_PUBLIC_API_URL` is correctly set, but you're still seeing demo mode. Here's why and how to fix it:

## 🚨 Common Causes

### 1. **Frontend Wasn't Restarted After Env Var Change**
Environment variables in Next.js are **baked into the build at build time**. Changing the env var requires a **rebuild**, not just a restart.

#### Fix:
```
1. Go to Northflank → Frontend Service
2. Click "Deploy" (not just "Restart")
3. Wait for rebuild (~5 minutes)
4. Then test
```

### 2. **Browser Cache**
Your browser cached the old JavaScript bundle with the wrong URL.

#### Fix:
```
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Or clear site data:
   - Open DevTools (F12)
   - Application tab → Clear Storage → Clear site data
3. Close and reopen the tab
```

### 3. **Next.js Build-Time vs Runtime Variables**
Next.js variables starting with `NEXT_PUBLIC_` are replaced at **build time**, not runtime.

#### Fix:
You must **rebuild** (not restart) after changing environment variables.

---

## ✅ Step-by-Step Fix

### Step 1: Force Rebuild Frontend
```bash
# In Northflank UI:
1. Go to: Frontend Service
2. Click: "Builds" tab
3. Click: "Deploy" or "Rebuild" button
4. Wait: 5-7 minutes for build to complete
```

### Step 2: Verify Build Completed
```bash
# Check build logs show success
# Look for: "Build completed successfully"
```

### Step 3: Hard Refresh Browser
```bash
# Chrome/Firefox: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
# Safari: Cmd+Option+R
```

### Step 4: Check Browser Console
```bash
1. Open frontend in browser
2. Press F12 (or Cmd+Option+I)
3. Go to Console tab
4. Look for log: "Worker URL Configuration"
5. Should show: https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run
```

---

## 🧪 Test If It's Working

### Test 1: Check Console Logs
```javascript
// Open browser console (F12) on your frontend
// Look for these logs (from src/lib/api.ts):

🔍 Worker URL Configuration: {
  url: "https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run",
  originalEnv: "https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run",
  env: "production",
  isClient: true
}
```

If you see the wrong URL here, the frontend wasn't rebuilt.

### Test 2: Check Network Tab
```bash
1. Open DevTools (F12)
2. Go to Network tab
3. Try to upload a video
4. Look for request to /upload-video
5. Check the URL - should be "gpu" not "apu"
```

### Test 3: Direct Upload Test
```bash
# Test upload via API directly
PROJECT_ID=$(curl -s "https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/users/test@colmap.app/projects" | jq -r '.[0].id')

echo "Testing upload with project: $PROJECT_ID"

# This should work (you need a real video file)
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/upload-video \
  -F "video=@YOUR_VIDEO.mp4;type=video/mp4" \
  -F "project_id=$PROJECT_ID" \
  -F "scan_name=Direct API Test" \
  -F "quality=low" \
  -F "user_email=test@colmap.app"
```

If direct API upload works but UI doesn't, it's definitely a frontend issue.

---

## 🐛 Debugging Checklist

- [ ] Environment variable is set in Northflank ✅ (you confirmed this)
- [ ] Frontend was **REBUILT** (not just restarted) after env var change
- [ ] Browser cache cleared (hard refresh)
- [ ] No old tabs open with cached version
- [ ] Browser console shows correct URL in logs
- [ ] Network tab shows requests going to correct URL
- [ ] Direct API upload works (proves backend is fine)

---

## 📊 Understanding the Issue

### How Next.js Environment Variables Work:

```
Build Time (when code is compiled):
  NEXT_PUBLIC_API_URL → Gets replaced in JavaScript
  
Runtime (when page loads):
  The value is already in the JS bundle
  Changing env var doesn't affect running app
  
Solution:
  REBUILD the app to bake in new value
```

### Why Restart Isn't Enough:

```
Restart:  Starts the same container with same built code
Rebuild:  Recompiles code with new environment variables
```

---

## 🔧 Most Likely Solution

Since your env var is correct, you probably just need to:

```bash
1. Northflank → Frontend → Click "Deploy"
2. Wait 5 minutes
3. Hard refresh browser (Ctrl+Shift+R)
4. Try upload again
```

---

## 🎯 Verification Commands

### Check Backend is Working:
```bash
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/health | jq .
# Should return: { "status": "healthy", "gpu_enabled": true }
```

### Check Database:
```bash
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/database/status | jq .
# Should return: { "status": "connected" }
```

### Test Upload:
```bash
# Get project
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/users/test@colmap.app/projects | jq '.[0]'

# Upload (need real video file)
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/upload-video \
  -F "video=@test.mp4;type=video/mp4" \
  -F "project_id=PROJECT_ID" \
  -F "scan_name=Test" \
  -F "quality=low" \
  -F "user_email=test@colmap.app"
```

---

## 💡 Pro Tips

1. **Always rebuild** after changing `NEXT_PUBLIC_*` variables
2. **Hard refresh** browser after frontend deploys
3. **Check console logs** to see what URL is being used
4. **Test API directly** to isolate frontend vs backend issues
5. **Clear browser cache** if seeing old behavior

---

## 🚀 Quick Fix (90% Success Rate)

```bash
# Do this now:
1. Northflank → Frontend → "Deploy" button
2. Wait 5 minutes
3. Browser: Ctrl+Shift+R (hard refresh)
4. Try upload
```

**This should fix it!**

If not, check browser console for the actual URL being used.


