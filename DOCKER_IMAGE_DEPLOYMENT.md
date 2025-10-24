# Pre-Built Docker Image Deployment

This setup bypasses Northflank's build infrastructure issues by building the Docker image in GitHub Actions and having Northflank pull the pre-built image.

---

## 🎯 How It Works

```
GitHub Push → GitHub Actions → Build Docker Image → Push to GitHub Container Registry → Northflank Pulls Image
```

**Advantages:**
- ✅ Bypasses Northflank build I/O errors
- ✅ Faster deployments (no build step)
- ✅ Consistent builds (same environment)
- ✅ Free GitHub Container Registry
- ✅ Automatic on every push

---

## 📋 Setup Instructions

### 1. Enable GitHub Actions (Already Done ✅)

The workflow file is at: `.github/workflows/docker-build.yml`

It will automatically:
- Build Docker image on every push to `main`
- Push to GitHub Container Registry
- Tag with `latest` and commit SHA

### 2. Make Repository Package Public

**Go to:**
```
https://github.com/marco-interact/colmap-mvp/settings/packages
```

After first build, you'll see package `colmap-mvp`:
1. Click on the package
2. Click **"Package settings"**
3. Scroll to **"Danger Zone"**
4. Click **"Change visibility"** → **"Public"**

(This allows Northflank to pull without authentication)

### 3. Configure Northflank to Use Pre-Built Image

**In Northflank Dashboard:**

#### Backend Service (`colmap-worker-gpu`):

1. Go to **Service Settings** → **Build Configuration**
2. Change **Build Type** from "Dockerfile" to **"External Image"**
3. Set **Image URL:**
   ```
   ghcr.io/marco-interact/colmap-mvp:latest
   ```
4. **Save** and **Deploy**

---

## 🏗️ Build Status

After pushing to GitHub, monitor build at:
```
https://github.com/marco-interact/colmap-mvp/actions
```

**Build takes:** ~10-15 minutes

**Output image:**
```
ghcr.io/marco-interact/colmap-mvp:latest
```

---

## 🚀 Deployment Flow

### Automatic (Recommended):

```bash
# 1. Make changes to code
git add .
git commit -m "your changes"
git push origin main

# 2. GitHub Actions builds Docker image (10-15 min)
# 3. Image pushed to ghcr.io/marco-interact/colmap-mvp:latest
# 4. Northflank auto-detects new image and redeploys
```

### Manual Trigger:

1. Go to: https://github.com/marco-interact/colmap-mvp/actions
2. Click **"Build and Push Docker Image"**
3. Click **"Run workflow"** → **"Run workflow"**

---

## 🔍 Verify Image

After GitHub Actions completes:

```bash
# Pull the image locally (optional)
docker pull ghcr.io/marco-interact/colmap-mvp:latest

# Check image size
docker images ghcr.io/marco-interact/colmap-mvp:latest

# Run locally for testing
docker run -p 8000:8000 ghcr.io/marco-interact/colmap-mvp:latest
```

---

## 🎛️ Northflank Configuration

### Service Settings to Update:

**Build Configuration:**
```yaml
Build Type: External Image
Image: ghcr.io/marco-interact/colmap-mvp:latest
Pull Policy: Always (or IfNotPresent)
```

**Deployment Settings (keep existing):**
```yaml
Compute: nf-gpu-a100-40-1g
GPU: A100 (40GB) x1
Memory: 87040 MB
vCPU: 12
```

**Environment Variables (keep all existing):**
```bash
# All your existing env vars stay the same
DATABASE_PATH=/persistent-data/database.db
STORAGE_DIR=/persistent-data/results
# etc...
```

**Persistent Volume (keep):**
```yaml
Name: colmap-persistent-data
Mount: /persistent-data
Size: 100 GB
```

---

## 🐛 Troubleshooting

### Build Fails in GitHub Actions

**Check:**
1. Go to Actions tab: https://github.com/marco-interact/colmap-mvp/actions
2. Click on the failed workflow
3. Expand steps to see error
4. Common issues:
   - Dockerfile syntax error
   - Out of disk space (unlikely on GitHub)
   - Missing files (check .dockerignore)

**Fix:**
- Fix the error
- Push again

### Northflank Can't Pull Image

**Error:** "failed to pull image"

**Solution:**
1. Make package public (see step 2 above)
2. OR: Add GitHub token to Northflank:
   - Northflank → Service → Secrets
   - Add `GITHUB_TOKEN` with read:packages permission

### Image Size Too Large

**Current image:** ~2-3 GB (with Open3D)

**To reduce:**
1. Use multi-stage build
2. Remove unnecessary dependencies
3. Use Alpine base (not recommended for CUDA)

**Not an issue:** GitHub has no size limits for packages

---

## 📊 Comparison

### Before (Build on Northflank):

```
Commit → Push → Northflank Build (FAILS with I/O error) ❌
```

### After (Pre-Built Image):

```
Commit → Push → GitHub Actions Build (15 min) → Northflank Pull (2 min) ✅
```

**Time:** Slower first time, but more reliable

---

## 🔄 Update Process

### To Deploy New Changes:

```bash
# 1. Make changes
vim main.py

# 2. Commit and push
git add .
git commit -m "add feature X"
git push origin main

# 3. Wait for GitHub Actions to build (~15 min)
# Monitor at: https://github.com/marco-interact/colmap-mvp/actions

# 4. Northflank auto-pulls new image
# OR manually redeploy in Northflank dashboard
```

---

## ✅ Benefits

1. **Reliable Builds** - No Northflank I/O errors
2. **Faster Subsequent Deploys** - Just pulls image (2 min)
3. **Consistent Environment** - Same build every time
4. **Version Control** - Each commit has its image
5. **Rollback Easy** - Use specific SHA tags
6. **Free** - GitHub Container Registry is free for public repos

---

## 🎯 Next Steps

1. ✅ Push code to GitHub (workflow is ready)
2. ⏳ Wait for GitHub Actions to build (~15 min)
3. ✅ Make package public
4. ✅ Update Northflank to use `ghcr.io/marco-interact/colmap-mvp:latest`
5. ✅ Deploy and test

---

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Build & Push Action](https://github.com/marketplace/actions/build-and-push-docker-images)
- [Northflank External Images](https://northflank.com/docs/v1/application/deployment/external-images)

---

## 🎉 Result

Once configured:
- ✅ No more build errors
- ✅ Demo project accessible
- ✅ Open3D features available
- ✅ Reliable deployments
- ✅ Production-ready

