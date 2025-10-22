# 🚀 Quick Start - Deploy to Northflank

**Time:** 15 minutes  
**Cost:** ~$20-40/month  
**Result:** Live COLMAP 3D reconstruction service

---

## ⚡ 3-Step Deployment

### Step 1: Push to GitHub (2 min)

```bash
cd /Users/marco.aurelio/Desktop/colmap-mvp

# Add new files
git add Dockerfile requirements.txt northflank.json .dockerignore

# Commit
git commit -m "Add Northflank deployment configuration"

# Push
git push origin main
```

### Step 2: Create Northflank Service (5 min)

1. **Go to:** https://app.northflank.com
2. **Create Project:**
   - Click **"New Project"**
   - Name: `colmap-mvp`

3. **Add Service:**
   - Click **"Add Service"** → **"Deployment"**
   - **Source:** GitHub → `marco-interact/colmap-mvp`
   - **Branch:** `main`

4. **Configure:**
   - **Build:** Dockerfile at `/Dockerfile`
   - **Plan:** `nf-compute-50` (2 CPU, 4GB RAM)
   - **Port:** 8000 (HTTP, public)

5. **Environment Variables:**
   ```
   COLMAP_CPU_ONLY=1
   PORT=8000
   PYTHONUNBUFFERED=1
   ```

6. **Click:** **"Create Deployment"**

### Step 3: Verify (3 min)

Wait for build (~5-10 min), then:

```bash
# Get your URL from Northflank dashboard
export API_URL="https://colmap-backend-xxxxx.northflank.app"

# Test health
curl $API_URL/health | jq

# Test COLMAP
curl $API_URL/colmap/check | jq

# Should see: "colmap_installed": true
```

---

## ✅ Expected Output

```json
{
  "status": "healthy",
  "colmap_installed": true,
  "colmap_version": "COLMAP 3.12.6",
  "cpu_mode": true,
  "gpu_available": false
}
```

---

## 🎯 What You Get

- ✅ **Live API** at generated Northflank URL
- ✅ **CPU-based COLMAP** 3D reconstruction
- ✅ **Auto-healing** if service crashes
- ✅ **HTTPS** SSL certificate included
- ✅ **Monitoring** built-in
- ✅ **Logs** accessible via dashboard

---

## 📊 Performance

**Processing Times (CPU mode):**
- Low quality: 5-10 minutes
- Medium quality: 15-25 minutes  
- High quality: 30-60 minutes

**Resource Usage:**
- 2 vCPU @ 80-90% during processing
- 4GB RAM (2-3GB used typically)
- 10GB storage (scalable)

---

## 💰 Cost Estimate

```
Development Plan (nf-compute-50):
  2 vCPU, 4GB RAM
  ~$20/month
  
Production Plan (nf-compute-100):
  4 vCPU, 8GB RAM
  ~$40/month
```

---

## 🔄 Update Deployment

```bash
# Make changes locally
git add .
git commit -m "Update deployment"
git push origin main

# Northflank auto-deploys on push!
```

---

## 🐛 Troubleshooting

**Build fails?**
```bash
# Test locally first
docker build -t colmap-test .
docker run -p 8000:8000 -e COLMAP_CPU_ONLY=1 colmap-test
```

**Service unhealthy?**
- Check logs in Northflank dashboard
- Verify environment variables
- Ensure port 8000 is exposed

**Out of memory?**
- Upgrade to larger plan (4GB → 8GB)
- Or reduce quality settings

---

## 📚 Full Documentation

For detailed configuration, monitoring, and optimization:
→ **[docs/2025-10-22/NORTHFLANK_DEPLOYMENT.md](./docs/2025-10-22/NORTHFLANK_DEPLOYMENT.md)**

---

**Status:** Ready to deploy! 🚀

