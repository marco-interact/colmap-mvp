# 🔄 Northflank Rebuild Instructions

## After Pushing Code Changes to GitHub

When you push new code to GitHub, Northflank needs to **rebuild** the service to deploy the changes.

---

## 🎯 Auto-Deploy (Recommended)

### Enable Automatic Deployments

1. Go to [Northflank Dashboard](https://app.northflank.com)
2. Select your project
3. Click on **COLMAP Worker GPU** service
4. Go to **CI/CD** tab
5. Enable **"Automatic deployments from main branch"**

Now every `git push` will trigger an automatic rebuild! 🚀

---

## 🔧 Manual Rebuild (Current Method)

If auto-deploy is not enabled, rebuild manually:

### Option 1: Via Northflank UI

1. Go to [Northflank Dashboard](https://app.northflank.com)
2. Select your project
3. Click on **COLMAP Worker GPU** service
4. Click **"Deploy"** button in top right
5. Confirm deployment

### Option 2: Via Northflank CLI

```bash
# Install Northflank CLI
npm install -g @northflank/cli

# Login
northflank login

# Deploy backend
northflank deploy \
  --project colmap-mvp \
  --service colmap-worker-gpu \
  --tag main

# Deploy frontend
northflank deploy \
  --project colmap-mvp \
  --service colmap-frontend \
  --tag main
```

---

## ⏱️ Deployment Timeline

| Stage | Duration |
|-------|----------|
| **GitHub Push** | Instant |
| **Northflank Detection** | ~10s |
| **Docker Build** | 5-10 min (backend), 2-3 min (frontend) |
| **Image Push** | ~1 min |
| **Pod Restart** | ~30s |
| **Total** | ~7-12 min |

---

## 🧪 Testing New Endpoints

After rebuilding, wait for deployment to complete, then test:

```bash
# Check if new endpoints are live
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/database/status

# If you get "Not Found", wait 2-3 more minutes and try again
```

---

## 📊 Current Changes Waiting for Deployment

### Backend (main.py)

**New Endpoints**:
- `GET /database/status` - Check database connectivity
- `POST /database/init-test-data` - Initialize demo data
- Updated `/health` - Now includes database status

**Changes**:
```python
# Health endpoint now shows database info
{
  "status": "healthy",
  ...
  "database_path": "/app/data/colmap_app.db",
  "database_exists": true
}
```

---

## 🚀 Next Steps

### After Backend Rebuilds

1. **Test database status**:
   ```bash
   curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/database/status
   ```

2. **Initialize test data**:
   ```bash
   curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/database/init-test-data
   ```

3. **Run full database test**:
   ```bash
   ./test-database.sh
   ```

4. **Test upload workflow**:
   ```bash
   ./test-deployment.sh
   ```

---

## 🔍 Verifying Deployment Status

### Check Build Logs

1. Go to Northflank Dashboard
2. Click on service
3. Click **"Builds"** tab
4. View latest build logs

### Check Runtime Logs

1. Click **"Logs"** tab
2. Look for:
   ```
   INFO: Database initialized successfully
   INFO: Started server process
   INFO: Application startup complete
   ```

### Health Check

```bash
# Should return "healthy"
curl https://YOUR_URL/health | jq '.status'

# Should return "connected" (after rebuild)
curl https://YOUR_URL/database/status | jq '.status'
```

---

## 📝 Deployment Checklist

- [ ] Code pushed to GitHub (`git push origin main`)
- [ ] Northflank detected new commit
- [ ] Build started (check Builds tab)
- [ ] Build completed successfully
- [ ] Pod restarted
- [ ] Health check passes
- [ ] New endpoints accessible
- [ ] Database status returns "connected"

---

## 🐛 Troubleshooting

### Build Fails

**Check**:
1. Build logs in Northflank
2. Dockerfile syntax
3. Python dependencies in requirements.txt

### Deployment Takes Too Long

**Cause**: Building COLMAP from source takes time

**Solution**: Wait 10-15 minutes for first build. Subsequent builds use cached layers.

### New Endpoints Not Found

**Cause**: Old version still running

**Solutions**:
1. Hard refresh: Ctrl+F5 (browser)
2. Check deployment status in Northflank
3. Manually restart service

---

## 🎯 Enable Auto-Deploy Now

**Highly Recommended**: Set up automatic deployments to avoid manual rebuilds.

### Steps:

1. Northflank Dashboard → Your Project
2. COLMAP Worker GPU → CI/CD
3. Enable **"Deploy on push to main"**
4. Save settings

Now every `git push` automatically deploys! 🚀

---

## 📞 Support

If deployment fails:
1. Check Northflank build logs
2. Verify GitHub integration is working
3. Check environment variables are set
4. Verify persistent volumes are mounted

---

**Ready to rebuild?** Go to [Northflank Dashboard](https://app.northflank.com) and click **Deploy**! 🚀

