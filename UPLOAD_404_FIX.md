# Upload 404 Fix

**Issue:** Upload failed with 404 error  
**Date:** October 29, 2025  
**Status:** ✅ **FIXED**

---

## Problem

Frontend was calling wrong API endpoints:
- `/upload-video` ❌
- `/projects` ❌
- `/projects/{id}` ❌
- `/projects/{id}/scans` ❌

Backend has correct routes:
- `/api/reconstruction/upload` ✅
- `/api/projects` ✅
- `/api/projects/{id}` ✅
- `/api/projects/{id}/scans` ✅

---

## Solution

Updated `src/lib/api.ts` to use correct API paths with `/api/` prefix.

### Fixed Endpoints

| Function | Before | After | Status |
|----------|--------|-------|--------|
| `uploadVideo` | `/upload-video` | `/api/reconstruction/upload` | ✅ Fixed |
| `getAllProjects` | `/projects` | `/api/projects` | ✅ Fixed |
| `getProject` | `/projects/{id}` | `/api/projects/{id}` | ✅ Fixed |
| `getScans` | `/projects/{id}/scans` | `/api/projects/{id}/scans` | ✅ Fixed |
| `getProjectScans` | `/projects/{id}/scans` | `/api/projects/{id}/scans` | ✅ Fixed |
| `createProject` | `/projects` | `/api/projects` | ✅ Fixed |

---

## Deployment

**Commits:**
- `7d7c7e0a` - Complete API endpoint path corrections
- `7bb87905` - Initial endpoint path corrections

**Status:** ✅ Pushed to GitHub

---

## Testing

To test upload functionality:

1. **Pull latest code on RunPod:**
   ```bash
   cd /workspace/colmap-mvp
   git pull origin main
   ```

2. **Restart backend:**
   ```bash
   pkill -f "python.*main.py"
   source venv/bin/activate
   nohup python main.py > backend.log 2>&1 &
   ```

3. **Test upload:**
   - Upload video through frontend
   - Should now work without 404 errors

---

## Backend Routes (Reference)

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/{id}` - Get single project
- `POST /api/projects` - Create project

### Scans
- `GET /api/projects/{id}/scans` - Get scans for project

### Reconstruction
- `POST /api/reconstruction/upload` - Upload video for reconstruction
- `GET /api/reconstruction/{job_id}/status` - Get reconstruction status

### Database
- `GET /api/reconstruction/{job_id}/database/inspect` - Inspect database
- `POST /api/reconstruction/{job_id}/database/clean` - Clean database

### Export
- `POST /api/reconstruction/{job_id}/export` - Export reconstruction
- `GET /api/reconstruction/{job_id}/download/{filename}` - Download file

---

## Next Steps

1. ✅ Pull latest code on RunPod
2. ✅ Restart backend
3. ⏭️ Test video upload from frontend
4. ⏭️ Verify upload works correctly

---

**Issue:** ✅ **RESOLVED**


