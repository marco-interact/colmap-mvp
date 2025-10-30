# Persistent Storage Setup for RunPod

## Problem

Your demo project disappears on every pod restart because `/workspace` is NOT mounted to persistent volume `colmap-storage (mtb2kqkyin)`.

---

## Solution: Mount Volume to `/workspace`

### Method 1: Edit Existing Pod (EASIEST)

1. Go to **RunPod Dashboard** → Select your pod
2. Click **Edit Pod** button
3. Find **Volume Mount Path** field (should show `/workspace`)
4. Under **Volume Disk** section, click **"+ Attach Network Volume"**
5. Select `colmap-storage` from dropdown
6. Ensure mount path is `/workspace`
7. Click **Save** (pod will restart)

### Method 2: Recreate Pod with Volume (NUCLEAR)

If Method 1 doesn't work:

1. **Note your current setup:**
   - Container image: `runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404`
   - HTTP port: `8000`
   - TCP port: `22`
   - Environment variables (if any)

2. **Create new pod:**
   - Name: same as before
   - Container image: same as above
   - Attach network volume: `colmap-storage` → Mount at: `/workspace`
   - HTTP port: `8000`
   - TCP port: `22`

3. **Transfer data from old pod:**
   ```bash
   # On OLD pod, backup everything
   cd /workspace
   tar czf /tmp/backup.tar.gz colmap-mvp/* data/ database.db
   
   # On NEW pod, restore everything
   cd /workspace
   tar xzf /tmp/backup.tar.gz
   ```

---

## Verification

After mounting volume:

```bash
# 1. Verify volume is mounted
mount | grep /workspace
# Should show: ... on /workspace type ...

# 2. Create persistence marker
date > /workspace/.persist-test
cat /workspace/.persist-test

# 3. Restart pod and verify marker still exists
# (restart from RunPod dashboard)
# Then SSH in again and run:
cat /workspace/.persist-test
# Should show same timestamp!

# 4. Start backend
cd /workspace/colmap-mvp
git fetch origin && git reset --hard origin/main
source venv/bin/activate
nohup python main.py > backend.log 2>&1 & sleep 6
tail -n 120 backend.log

# 5. Verify demo data
curl http://localhost:8000/api/projects
# Should return 1 project with 2 scans
```

---

## Why This Matters

- **Without volume:** Database is ephemeral → wiped on restart
- **With volume:** Database persists → demo data stays forever

---

## Current Status

✅ Backend code: Working
✅ Demo data seeding: Working
❌ **Volume mount: NOT CONFIGURED**
❌ **Storage persistence: BROKEN**

---

**NEXT STEP: Mount `colmap-storage` to `/workspace` in RunPod dashboard!**

