# 🔧 Fix "no healthy upstream" Error

**Status:** Fixed - Deploy and configure  
**Issue:** Both services build successfully but show "no healthy upstream"  
**Solution:** Simplified health endpoints + proper configuration

---

## ✅ **What I Fixed**

### **1. Backend Health Endpoints**
- ✅ Simplified `/health` endpoint (no complex GPU checks)
- ✅ Simplified `/readiness` endpoint
- ✅ Fixed syntax error in root `/` endpoint
- ✅ Added proper error handling to prevent crashes

**Changes pushed to:** `main` branch (commit: `94513f8b`)

---

## 🚀 **Deploy the Fix**

### **Step 1: Redeploy Backend Service**

1. **Go to Northflank**: https://app.northflank.com
2. **Select your backend service**: `colmap-worker-gpu`
3. **Click "Redeploy"** button
4. **Wait 15-20 minutes** for build to complete
5. **Check logs** for: `✓ Service started successfully`

**Expected in logs:**
```
INFO: Started server process
INFO: Waiting for application startup
INFO: Application startup complete
INFO: Uvicorn running on http://0.0.0.0:8000
```

---

### **Step 2: Verify Backend is Running**

Test the backend URL directly:

```bash
# Replace with your actual backend URL
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/

# Expected response:
{
  "message": "COLMAP Worker API",
  "status": "running",
  "version": "2.0-gpu",
  "timestamp": "2025-10-23T..."
}
```

```bash
# Test health endpoint
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/health

# Expected response:
{
  "status": "healthy",
  "service": "colmap-worker",
  "timestamp": "2025-10-23T...",
  "version": "2.0-gpu"
}
```

---

### **Step 3: Configure Frontend Environment Variable**

1. **Go to your frontend service** in Northflank
2. **Edit Service** → **Environment Variables**
3. **Add or Update**:
   ```
   Key: NEXT_PUBLIC_API_URL
   Value: https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run
   ```
4. **Save** and **Redeploy** frontend

---

### **Step 4: Verify Frontend Connection**

```bash
# Test frontend
curl https://site--colmap-frontend--xf7lzhrl47hj.code.run

# Should return HTML, not "no healthy upstream"
```

---

## 🔍 **Common Issues & Solutions**

### **Issue 1: Backend Still Shows "no healthy upstream"**

**Check Logs:**
```
1. Go to backend service
2. Click "Logs" tab
3. Look for error messages
```

**Common Errors:**

#### **A. Port Mismatch**
```
Error: Address already in use
```
**Solution:** Service should use port 8000 (already configured)

#### **B. Database Error**
```
Error: Unable to open database
```
**Solution:** Check database path in environment variables

#### **C. Missing Dependencies**
```
ModuleNotFoundError: No module named 'xxx'
```
**Solution:** Check if all imports in main.py are in requirements.txt

---

### **Issue 2: Frontend Can't Connect to Backend**

**Symptoms:**
- Frontend loads but shows errors
- API calls fail
- "Failed to fetch" errors in browser console

**Solution:**

1. **Verify `NEXT_PUBLIC_API_URL` is set** in frontend service
2. **Ensure backend URL is correct** (no trailing slash)
3. **Check CORS** is enabled in backend (already configured)

**Test backend URL in browser:**
```
Open: https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run
Should see JSON response, not "no healthy upstream"
```

---

### **Issue 3: Services Keep Restarting**

**Check Health Check Settings:**

**Backend Service:**
```json
{
  "livenessProbe": {
    "path": "/health",
    "port": 8000,
    "initialDelaySeconds": 60,
    "periodSeconds": 30,
    "timeoutSeconds": 10
  }
}
```

**If service is slow to start:**
- Increase `initialDelaySeconds` to 90 or 120
- This gives COLMAP time to initialize

---

## 🎯 **Verification Checklist**

### **Backend Service:**
- [ ] Build completes successfully
- [ ] Service status shows "Running"
- [ ] Logs show "Uvicorn running on http://0.0.0.0:8000"
- [ ] `/health` endpoint returns `{"status": "healthy"}`
- [ ] Root `/` endpoint returns API info
- [ ] No restart loops in events

### **Frontend Service:**
- [ ] Build completes successfully
- [ ] `NEXT_PUBLIC_API_URL` environment variable is set
- [ ] Frontend URL loads (not "no healthy upstream")
- [ ] Can see the login page or dashboard

---

## 📊 **Expected URLs**

| Service | URL | Status Check |
|---------|-----|--------------|
| **Backend** | https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run | `curl /health` |
| **Frontend** | https://site--colmap-frontend--xf7lzhrl47hj.code.run | Open in browser |

---

## 🛠️ **Advanced Debugging**

### **1. Check Backend Logs in Real-time**

In Northflank:
```
Service → Logs → Enable "Live" mode
```

Look for:
- ✅ `Started server process`
- ✅ `Application startup complete`
- ❌ Any error messages
- ❌ Repeated restarts

### **2. Test Locally (if needed)**

```bash
cd /Users/marco.aurelio/Desktop/colmap-mvp

# Start backend locally
python3 main.py

# Should see:
# INFO: Uvicorn running on http://0.0.0.0:8000
# INFO: Started server process

# In another terminal:
curl http://localhost:8000/health
```

### **3. Check Service Resources**

In Northflank dashboard:
- **CPU Usage**: Should be <10% when idle
- **Memory Usage**: Should be <50% on startup
- **Restart Count**: Should be 0

If restart count keeps increasing:
- Service is crashing
- Check logs for error messages
- May need to increase memory/CPU

---

## 🚨 **Emergency Fix: Rollback**

If the new deployment doesn't work:

1. **Go to service** in Northflank
2. **Click "Deployments" tab**
3. **Find previous working deployment**
4. **Click "Rollback"**

---

## 📞 **Still Having Issues?**

### **Collect This Information:**

1. **Backend logs** (last 100 lines)
2. **Frontend logs** (last 100 lines)
3. **Service status** (Running/Failed/Restarting)
4. **Environment variables** (screenshot)
5. **Health check response** (from curl)

### **Quick Tests:**

```bash
# Test 1: Backend health
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/health

# Test 2: Backend root
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/

# Test 3: COLMAP check
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/colmap/check

# Test 4: Frontend
curl https://site--colmap-frontend--xf7lzhrl47hj.code.run
```

---

## ✅ **Success Indicators**

You'll know it's working when:

1. **Backend URL** returns JSON (not "no healthy upstream")
2. **Frontend URL** shows login page (not "no healthy upstream")
3. **No restart loops** in Northflank events
4. **Health checks passing** consistently
5. **Can login** to frontend with demo@colmap.app

---

## 🎉 **Next Steps After Fix**

Once services are running:

1. **Test GPU availability**: `curl /colmap/check`
2. **Upload a test video**
3. **Monitor reconstruction performance**
4. **Check auto-scaling** behavior
5. **Set up monitoring alerts**

---

**Status:** Fix deployed, ready to redeploy  
**Priority:** HIGH - Service availability  
**ETA:** 20-25 minutes for full deployment
