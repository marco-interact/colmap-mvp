# RunPod Pull Commands

**Latest Updates:** API endpoint fixes for upload 404 errors  
**Date:** October 29, 2025

---

## 🚀 Quick Update (One Command)

Copy and paste this entire block into your RunPod terminal:

```bash
cd /workspace/colmap-mvp && pkill -f "python.*main.py" && sleep 2 && git pull origin main && source venv/bin/activate && pip install -q -r requirements.txt && nohup python main.py > backend.log 2>&1 & sleep 3 && tail backend.log && echo "✅ Backend restarted successfully"
```

---

## 📝 Step-by-Step Commands

If you prefer to run commands individually:

### Step 1: Navigate to Project
```bash
cd /workspace/colmap-mvp
```

### Step 2: Stop Backend
```bash
pkill -f "python.*main.py"
sleep 2
```

### Step 3: Pull Latest Code
```bash
git pull origin main
```

### Step 4: Update Dependencies (if needed)
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Step 5: Restart Backend
```bash
nohup python main.py > backend.log 2>&1 &
```

### Step 6: Verify
```bash
sleep 3
curl http://localhost:8000/health
tail backend.log
```

---

## ✅ What's Updated

### Latest Commit: `f2dcae37`
- ✅ Fixed upload 404 errors
- ✅ Corrected all API endpoint paths
- ✅ Updated documentation

### Recent Commits
```
f2dcae37 docs: Add upload 404 fix documentation
7d7c7e0a fix: Complete API endpoint path corrections for all routes
7bb87905 fix: Correct API endpoint paths to match backend routes
f7d8bdc9 docs: Add RunPod status and session completion summary
29d8c74c docs: Add RunPod update script and comprehensive update guide
```

---

## 🔍 Verify the Update

After pulling, verify everything is working:

### Check Backend Status
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "message": "Backend is running",
  "database_path": "/workspace/database.db"
}
```

### Check Git Version
```bash
git log --oneline -1
```

**Expected Output:**
```
f2dcae37 docs: Add upload 404 fix documentation
```

### Check Logs
```bash
tail -f backend.log
```

**Look for:**
```
INFO:__main__:🎯 COLMAP Backend ready!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## 🐛 Troubleshooting

### Issue: Backend Fails to Start

**Check logs:**
```bash
tail -20 backend.log
```

**Check if port is in use:**
```bash
lsof -i :8000
```

**Kill blocking process:**
```bash
pkill -f "python.*main.py"
sleep 2
cd /workspace/colmap-mvp
source venv/bin/activate
nohup python main.py > backend.log 2>&1 &
```

### Issue: Git Pull Fails

**Reset and pull:**
```bash
cd /workspace/colmap-mvp
git reset --hard origin/main
git clean -fd
git pull origin main
```

### Issue: Dependencies Fail

**Upgrade pip and retry:**
```bash
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir
```

---

## 📊 Expected Output

When everything works correctly, you should see:

```
INFO:__main__:🚀 Starting up COLMAP Backend...
INFO:__main__:✅ Database initialized
INFO:__main__:🗑️  Cleared all existing data
INFO:__main__:✅ Demo data created successfully
INFO:__main__:✅ Demo data initialized successfully
INFO:__main__:   Project ID: [some-uuid]
INFO:__main__:   Scan IDs: [array-of-uuids]
INFO:__main__:🎯 FINAL VERIFICATION: 1 projects, 2 scans
INFO:__main__:🎯 COLMAP Backend ready!
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## 🎯 What Was Fixed

### Upload 404 Error
**Problem:** Frontend calling `/upload-video` instead of `/api/reconstruction/upload`

**Fixed:** All API endpoints now correctly prefixed with `/api/`

### API Endpoint Corrections
| Before | After | Status |
|--------|-------|--------|
| `/upload-video` | `/api/reconstruction/upload` | ✅ Fixed |
| `/projects` | `/api/projects` | ✅ Fixed |
| `/projects/{id}` | `/api/projects/{id}` | ✅ Fixed |
| `/projects/{id}/scans` | `/api/projects/{id}/scans` | ✅ Fixed |

---

## 🔄 Next Steps

After successfully pulling and restarting:

1. ✅ Backend should be running on http://0.0.0.0:8000
2. ⏭️ Test video upload from frontend
3. ⏭️ Verify no more 404 errors
4. ⏭️ Check that demo projects/scans load correctly

---

## 📞 Quick Help

**Backend not starting?**
```bash
pkill -f "python.*main.py"
cd /workspace/colmap-mvp
source venv/bin/activate
python main.py
```

**Need to see full output?**
```bash
tail -f backend.log
```

**Check what's running:**
```bash
ps aux | grep python
```

---

## ✨ Summary

**Status:** ✅ All code pushed to GitHub  
**Latest Commit:** `f2dcae37`  
**Ready to Pull:** Yes  
**Estimated Time:** 1-2 minutes

**Run this command on RunPod:**
```bash
cd /workspace/colmap-mvp && pkill -f "python.*main.py" && sleep 2 && git pull origin main && source venv/bin/activate && nohup python main.py > backend.log 2>&1 & sleep 3 && curl http://localhost:8000/health
```

---

**Good luck! 🚀**


