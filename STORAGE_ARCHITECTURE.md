# Storage Architecture - Demo Data Persistence

## 🎯 **How Demo Data Persists (Never Gets Deleted)**

### **Storage Layout:**

```
Docker Container:
├── /app/                         # Application code (ephemeral)
│   ├── main.py
│   ├── database.py
│   └── demo-resources/           # Demo 3D models (baked into image)
│       ├── demoscan-dollhouse/
│       │   ├── fvtc_firstfloor_processed.ply
│       │   └── single_family_home_-_first_floor.glb
│       ├── demoscan-fachada/
│       │   ├── 1mill.ply
│       │   └── aleppo_destroyed_building_front.glb
│       └── thumbnails/
│           ├── demoscan-dollhouse-thumb.jpg
│           └── demoscan-fachada-thumb.jpg
│
└── /persistent-data/             # Persistent volume (100GB)
    ├── database.db               # SQLite database (PERSISTS)
    ├── results/                  # User reconstructions (PERSISTS)
    ├── cache/                    # COLMAP cache (PERSISTS)
    └── uploads/                  # User uploads (PERSISTS)
```

---

## ✅ **Why Demo Data Never Gets Deleted:**

### **1. Database is Persistent**
```bash
DATABASE_PATH=/persistent-data/database.db
```
- ✅ Stored on **Northflank Persistent Volume** (100GB)
- ✅ Survives container restarts
- ✅ Survives deployments
- ✅ Only deleted if you manually delete the volume

### **2. Demo Resources in Docker Image**
```bash
/app/demo-resources/
```
- ✅ Baked into Docker image
- ✅ Always available when container starts
- ✅ No copying needed
- ✅ Served directly from image

### **3. Smart Initialization Logic**

**In `database.py` (lines 470-491):**
```python
# Check if demo project already exists
existing_project = conn.execute(
    'SELECT id FROM projects WHERE user_id = ? AND name = ?',
    (user_id, "Demo Showcase Project")
).fetchone()

if existing_project:
    logger.info("Demo data already exists, skipping setup")
    return {"status": "success", "skipped": True}
```

**Result:**
- ✅ First startup: Creates demo project
- ✅ Subsequent startups: Skips (data already exists)
- ✅ Never duplicates or recreates

---

## 🔄 **Startup Flow:**

```
Container Starts
    ↓
Load database from /persistent-data/database.db
    ↓
Check: Does "Demo Showcase Project" exist?
    ↓
├─ YES → Skip initialization (use existing)
│         ✅ Demo still visible
│         ✅ No data loss
│
└─ NO → Create demo project
          ✅ Insert 2 scans
          ✅ Link to /demo-resources/ files
```

---

## 📊 **Data Persistence Comparison:**

| Data Type | Location | Persistence | Purpose |
|-----------|----------|-------------|---------|
| **Demo Database Records** | `/persistent-data/database.db` | ✅ **Permanent** | Project/scan metadata |
| **Demo PLY/GLB Files** | `/app/demo-resources/` | ✅ **Permanent** (in image) | 3D models |
| **Demo Thumbnails** | `/app/demo-resources/thumbnails/` | ✅ **Permanent** (in image) | Preview images |
| **User Uploads** | `/persistent-data/uploads/` | ✅ **Permanent** | User video files |
| **User Reconstructions** | `/persistent-data/results/` | ✅ **Permanent** | COLMAP output |
| **Application Code** | `/app/*.py` | ⚠️ **Ephemeral** | Updated on redeploy |

---

## 🛡️ **Protection Against Data Loss:**

### **✅ What Persists Across:**
- Container restarts: ✅
- Service restarts: ✅
- Deployments (new image): ✅
- Code updates: ✅
- Demo resources update: ✅ (database keeps referencing them)

### **❌ What WOULD Delete Data:**
- Manually deleting persistent volume: ❌ (don't do this!)
- Detaching volume from service: ❌ (don't do this!)
- Calling `/database/reset` endpoint: ❌ (manual action)

---

## 🔍 **Verification:**

### **Check Demo Data Exists:**
```bash
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/projects
```

**Expected Response:**
```json
{
  "projects": [
    {
      "id": "...",
      "name": "Demo Showcase Project",
      "description": "Sample 3D reconstructions demonstrating COLMAP capabilities",
      "scan_count": 2
    }
  ]
}
```

### **Check Demo Resources:**
```bash
# Dollhouse PLY
curl -I https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/demo-resources/demoscan-dollhouse/fvtc_firstfloor_processed.ply

# Facade GLB
curl -I https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/demo-resources/demoscan-fachada/aleppo_destroyed_building_front.glb
```

**Expected:** HTTP 200 OK

---

## 📝 **Database Schema:**

### **Projects Table:**
```sql
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP
)
```

### **Scans Table:**
```sql
CREATE TABLE scans (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    thumbnail_path TEXT,
    created_at TIMESTAMP
)
```

### **Technical Details Table:**
```sql
CREATE TABLE scan_technical_details (
    scan_id TEXT PRIMARY KEY,
    point_count INTEGER,
    camera_count INTEGER,
    results TEXT,  -- JSON with file URLs
    FOREIGN KEY (scan_id) REFERENCES scans (id)
)
```

**Demo Scans Store:**
```json
{
  "results": {
    "point_cloud_url": "/demo-resources/demoscan-dollhouse/fvtc_firstfloor_processed.ply",
    "mesh_url": "/demo-resources/demoscan-dollhouse/single_family_home_-_first_floor.glb",
    "thumbnail_url": "/demo-resources/thumbnails/demoscan-dollhouse-thumb.jpg"
  }
}
```

---

## 🐛 **Troubleshooting:**

### **Demo Project Missing:**

**Check database location:**
```bash
# In container
ls -la /persistent-data/database.db

# Should exist and be writable
```

**Manual Re-initialization:**
```bash
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/database/setup-demo
```

### **Demo Resources 404:**

**Check demo resources in image:**
```bash
# In container
ls -la /app/demo-resources/

# Should show:
# demoscan-dollhouse/
# demoscan-fachada/
# thumbnails/
```

**Verify .dockerignore allows demo-resources:**
```bash
# .dockerignore should NOT have:
# demo-resources/
```

### **Multiple Demo Projects:**

**Cleanup duplicates:**
```bash
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/database/cleanup-duplicates
```

---

## 🎉 **Result:**

✅ **Demo data is now permanent**
- Database persists on volume
- Resources baked into image
- Auto-initializes on first startup
- Never recreates if exists
- Survives all restarts and deployments

**You will NEVER lose demo data again!** 🚀

