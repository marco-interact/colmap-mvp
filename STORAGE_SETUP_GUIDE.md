# Storage Setup Guide - Persistent Data Configuration

## Problem
Demo project and scans disappear after container restart because storage is ephemeral.

## Solution
Configure persistent volume storage in Northflank (already committed in code).

---

## Step-by-Step Setup

### 1. Configure Persistent Volume in Northflank

Go to: **Backend Service** (`colmap-worker-gpu`) → **Settings** → **Storage**

**Add Persistent Volume:**
```
Name: colmap-persistent-data
Mount Path: /persistent-data
Size: 100 GB
Storage Class: SSD (recommended)
```

Click **"Create Volume"** or **"Add Volume"**

### 2. Verify Environment Variables

Go to: **Backend Service** → **Settings** → **Environment Variables**

Ensure these are set (already in northflank.json):
```bash
DATABASE_PATH=/persistent-data/database.db
STORAGE_DIR=/persistent-data/results
CACHE_DIR=/persistent-data/cache
UPLOADS_DIR=/persistent-data/uploads
```

### 3. Redeploy Backend

**Option A: Automatic Deploy**
- Push to main branch (already done) → Northflank auto-deploys

**Option B: Manual Deploy**
- Go to **Backend Service** → Click **"Restart & Deploy"**

**Wait ~10-15 minutes** for:
- Docker image rebuild (includes demo-resources)
- Container restart with new volume mounted

### 4. Initialize Demo Data

After backend is running, run this command:

```bash
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/database/setup-demo
```

Expected response:
```json
{
  "status": "success",
  "message": "Demo data setup completed",
  "user_id": "...",
  "project_id": "...",
  "scan_ids": ["...", "..."]
}
```

### 5. Verify Demo Data

Visit frontend: https://site--colmap-frontend--xf7lzhrl47hj.code.run/dashboard

You should see:
- ✅ **1 Project**: "Demo Showcase Project"
- ✅ **2 Scans**:
  - Dollhouse Interior Scan (with .ply and .glb)
  - Facade Architecture Scan (with .ply and .glb)

---

## Storage Architecture

### Before (Ephemeral - Lost on Restart)
```
/tmp/colmap_app.db          ❌ Database (lost)
/app/data/results/          ❌ Reconstructions (lost)
/app/data/cache/            ❌ Cache (lost)
/app/data/uploads/          ❌ Uploads (lost)
```

### After (Persistent - Survives Restarts)
```
/persistent-data/
  ├── database.db           ✅ Persistent SQLite DB
  ├── results/              ✅ All reconstructions
  │   ├── scan-id-1/
  │   │   ├── sparse_point_cloud.ply
  │   │   ├── thumbnail.jpg
  │   │   └── ...
  │   └── scan-id-2/
  ├── cache/                ✅ Processing cache
  └── uploads/              ✅ User videos
```

### Demo Resources (Included in Docker Image)
```
/app/demo-resources/        ✅ Baked into image
  ├── demoscan-dollhouse/
  │   ├── fvtc_firstfloor_processed.ply
  │   └── single_family_home_-_first_floor.glb
  ├── demoscan-fachada/
  │   ├── 1mill.ply
  │   └── aleppo_destroyed_building_front.glb
  └── thumbnails/
      ├── demoscan-dollhouse-thumb.jpg
      └── demoscan-fachada-thumb.jpg
```

---

## Troubleshooting

### Demo project not showing?

**Check backend logs:**
```bash
# In Northflank UI: Service → Runtime → Logs
# Look for:
INFO: Demo resources directory: /app/demo-resources
INFO: Storage Directory: /persistent-data/results
```

**Re-run demo setup:**
```bash
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/database/setup-demo
```

### Volume not mounted?

**Verify in backend container:**
```bash
# In Northflank: Service → Runtime → Console
ls -la /persistent-data/
# Should show: database.db, results/, cache/, uploads/
```

### Clean slate (reset all data)?

**Delete and recreate volume:**
1. Stop service
2. Delete `colmap-persistent-data` volume
3. Recreate volume (same name, 100GB)
4. Start service
5. Re-run demo setup

---

## Database Schema (COLMAP App - Not COLMAP's Internal DB)

Based on [COLMAP Database Management docs](https://colmap.github.io/tutorial.html#database-management):

### Our Application Database (`database.db`)
```sql
-- User management
users (id, email, name, created_at)

-- Project/scene management
projects (id, user_id, name, description, location, status, ...)

-- Scan/reconstruction management
scans (id, project_id, name, status, video_filename, ...)

-- Technical details (COLMAP results)
scan_technical_details (
  scan_id, 
  point_count,        -- 3D points from reconstruction
  camera_count,       -- Number of registered images
  feature_count,      -- SIFT keypoints detected
  reconstruction_error,
  results             -- JSON: {point_cloud_url, mesh_url, ...}
)
```

### COLMAP Internal Database (per reconstruction)
Location: `/persistent-data/results/{scan-id}/database.db`

Contains (per COLMAP docs):
```sql
cameras           -- Intrinsic parameters (focal length, distortion)
images            -- Extrinsic parameters (pose, rotation)
keypoints         -- SIFT features per image
descriptors       -- SIFT descriptors (128-dim vectors)
matches           -- Feature correspondences between image pairs
two_view_geometries  -- Geometric verification results
```

This follows COLMAP's data structure as documented.

---

## Next Steps After Setup

1. ✅ **Demo data working** → Test video upload
2. ✅ **Upload working** → Monitor processing pipeline
3. ✅ **Processing complete** → View 3D reconstruction
4. ✅ **All working** → Production ready!

---

## Storage Limits

- **Persistent Volume**: 100 GB (expandable)
- **Ephemeral Storage**: 256 GB (temporary processing)
- **Max Video Size**: 500 MB per upload
- **Estimated capacity**: ~100-200 reconstructions

Monitor usage: Northflank → Service → Metrics → Storage

