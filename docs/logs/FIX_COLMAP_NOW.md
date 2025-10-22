# 🔧 URGENT: Fix COLMAP Functionality

**Problem**: Frontend cannot connect to backend (CORS errors, 503 status)  
**Root Cause**: Frontend environment variable pointing to wrong URL  
**Time to Fix**: 5 minutes

---

## ✅ Backend Status (CONFIRMED WORKING)

Your backend is **fully operational**:
- ✅ API healthy at: `https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run`
- ✅ GPU enabled and available
- ✅ Database connected
- ✅ CORS configured correctly
- ✅ All endpoints responding

**Test yourself:**
```bash
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/health | jq .
```

---

## 🚨 The Issue

Your **frontend** is configured with the WRONG backend URL.

### Error You're Seeing:
```
http://p01--colmap-worker-apu--xf7lzhrl47hj.code.run/upload-video
                            ^^^
                        Should be "gpu" not "apu"
```

Status: **503 Service Unavailable** (because the URL doesn't exist)

---

## 🔧 THE FIX (5 minutes)

### Step 1: Update Northflank Frontend Environment Variable

1. **Open Northflank Dashboard**:
   ```
   https://app.northflank.com
   ```

2. **Navigate to Frontend Service**:
   - Find service: `colmap-frontend` or `p01--colmap-frontend--xf7lzhrl47hj`
   - Click on it

3. **Go to Environment Variables**:
   - Click "**Environment**" tab in left sidebar
   - Or look for "**Variables**" section

4. **Find or Create `NEXT_PUBLIC_API_URL`**:
   - If it exists, click "Edit"
   - If not, click "Add Variable"
   
5. **Set the Correct Value**:
   ```
   Key:   NEXT_PUBLIC_API_URL
   Value: https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run
   ```
   
   ⚠️ **IMPORTANT**: Use `https://` (not `http://`)  
   ⚠️ **IMPORTANT**: Use `gpu` (not `apu`)

6. **Save the Variable**:
   - Click "**Save**" or "**Update**"

7. **Restart the Frontend**:
   - Click "**Restart**" or "**Deploy**" button (top right)
   - Wait 1-2 minutes for restart to complete

---

### Step 2: Verify the Fix

After the frontend restarts, run this test:

```bash
# Check if frontend can reach backend
curl -I https://p01--colmap-frontend--xf7lzhrl47hj.code.run

# Open frontend in browser
open https://p01--colmap-frontend--xf7lzhrl47hj.code.run
```

**Expected Result**:
- ✅ No more CORS errors in browser console
- ✅ No more 503 errors
- ✅ Upload form should work

---

## 🧪 Step 3: Deploy Backend Diagnostic Endpoint

I've added a new endpoint to check if COLMAP is installed. Deploy it:

```bash
# Push to GitHub (this will auto-deploy on Northflank)
cd /Users/marco.aurelio/Desktop/colmap-mvp
git push origin main
```

Then test COLMAP installation:

```bash
# Wait 10 minutes for rebuild, then run:
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/colmap/check | jq .
```

**Expected Output**:
```json
{
  "colmap_installed": true,
  "colmap_version": "COLMAP 3.9.1",
  "opencv_installed": true,
  "opencv_version": "4.8.1",
  "gpu_name": "NVIDIA A100 (or T4/L4)",
  "gpu_available": true,
  "status": "ready"
}
```

**If `colmap_installed` is `false`**: COLMAP isn't compiled in your container.  
**If `opencv_installed` is `false`**: OpenCV isn't installed.

---

## 🐛 If COLMAP Is Not Installed

If `/colmap/check` shows `colmap_installed: false`, you need to rebuild the backend with COLMAP:

### Option A: Force Rebuild on Northflank
1. Go to Northflank dashboard
2. Select **COLMAP Worker GPU** service
3. Go to "**Builds**" tab
4. Click "**Deploy**" or "**Rebuild**"
5. Wait ~10-15 minutes for COLMAP to compile
6. Check again: `curl .../colmap/check`

### Option B: Verify Dockerfile
Make sure your Northflank backend service is using:
- **Dockerfile**: `Dockerfile.northflank`
- **Build context**: `/`
- **Docker build args**: None needed

---

## 📋 Quick Troubleshooting Checklist

Run this diagnostic script:
```bash
cd /Users/marco.aurelio/Desktop/colmap-mvp
./diagnose-colmap.sh
```

### Expected Results:
- ✅ Backend is healthy
- ✅ GPU is enabled
- ✅ Database connected
- ✅ CORS configured correctly
- ✅ Project API working

If **ALL of these pass**, then the only issue is your frontend URL configuration.

---

## 🎯 Test Video Upload (After Fix)

Once frontend is restarted with correct URL:

1. **Open Frontend**:
   ```
   https://p01--colmap-frontend--xf7lzhrl47hj.code.run
   ```

2. **Create or Select a Project**

3. **Upload a Test Video**:
   - Use a short MP4 video (<100MB)
   - Quality: "Low" (fastest for testing)
   - Click "Upload"

4. **Watch Processing**:
   - You should see progress updates
   - Stages: Frame Extraction → Feature Detection → Matching → Reconstruction
   - Total time: ~5-10 minutes for low quality

5. **View Results**:
   - When complete, 3D model should load in viewer
   - You can rotate, zoom, pan the point cloud

---

## 📊 Current Status Summary

| Component | Status | URL |
|-----------|--------|-----|
| **Backend API** | ✅ Healthy | `https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run` |
| **GPU** | ✅ Enabled | NVIDIA GPU available |
| **Database** | ✅ Connected | SQLite at `/app/data/colmap_app.db` |
| **CORS** | ✅ Working | Allows frontend origin |
| **COLMAP** | ⚠️ Unknown | Need to check `/colmap/check` endpoint |
| **Frontend** | ❌ Wrong URL | Needs env var update |

---

## 🚀 Next Steps (In Order)

1. ✅ **Verify backend is working** (DONE - it is!)
2. 🔧 **Fix frontend URL** (DO THIS NOW - see Step 1 above)
3. 🧪 **Push backend changes** (Adds diagnostic endpoint)
4. ⏳ **Wait for backend rebuild** (~10 minutes)
5. ✅ **Check COLMAP installation** (Use `/colmap/check` endpoint)
6. 🎬 **Test video upload** (Upload actual video)
7. 🎉 **Celebrate!** (System working end-to-end)

---

## 💡 Pro Tips

1. **Always use HTTPS** - Mixed content (HTTP on HTTPS page) is blocked by browsers
2. **Check browser console** - Press F12 to see actual errors
3. **Use "Low" quality first** - Faster testing, less GPU time
4. **Check backend logs** - Northflank dashboard → Service → Logs
5. **GPU quota limits** - Northflank may have GPU usage limits

---

## 📞 Support

If still broken after following this guide:

1. **Check Northflank Logs**:
   - Dashboard → Backend Service → Logs
   - Look for Python errors or COLMAP failures

2. **Verify Environment Variables**:
   ```bash
   # Should show your backend URL
   curl https://p01--colmap-frontend--xf7lzhrl47hj.code.run/api/health
   ```

3. **Test Direct Backend Upload**:
   ```bash
   curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/upload-video \
     -F "video=@test.mp4" \
     -F "project_id=test-project" \
     -F "scan_name=Test Scan" \
     -F "quality=low" \
     -F "user_email=test@colmap.app"
   ```

---

**Current Time**: October 15, 2025  
**Backend Version**: 1.0.0  
**Frontend**: Next.js 14  
**GPU**: NVIDIA (T4/L4/A100)

**✅ Your backend IS working - just fix the frontend URL!**


