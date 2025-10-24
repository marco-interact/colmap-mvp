# Manual Docker Image Build & Deployment

Since GitHub Actions requires special authentication, here's the manual approach to build and push the Docker image.

---

## ⚡ Quick Start (Recommended)

### Option A: Automated Script

```bash
# 1. Run the build script
./build-and-push.sh

# It will:
# - Build Docker image locally
# - Ask for GitHub credentials
# - Push to ghcr.io/marco-interact/colmap-mvp:latest
```

### Option B: Manual Commands

```bash
# 1. Build the image
docker build -t colmap-mvp:latest .

# 2. Tag for GitHub Container Registry
docker tag colmap-mvp:latest ghcr.io/marco-interact/colmap-mvp:latest

# 3. Create GitHub Personal Access Token
# Go to: https://github.com/settings/tokens/new?scopes=write:packages
# Copy the token

# 4. Login to GitHub Container Registry
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u marco-interact --password-stdin

# 5. Push the image
docker push ghcr.io/marco-interact/colmap-mvp:latest
```

---

## 📋 Prerequisites

1. **Docker installed** locally
   ```bash
   docker --version  # Should show Docker version
   ```

2. **GitHub Personal Access Token**
   - Go to: https://github.com/settings/tokens/new
   - Select scope: `write:packages`
   - Generate token
   - Save it somewhere safe

---

## 🔧 Configure Northflank

After pushing the image:

### 1. Make Package Public

1. Go to: https://github.com/marco-interact?tab=packages
2. Click on `colmap-mvp` package
3. **Package settings** → **Change visibility** → **Public**

### 2. Update Northflank Service

**In Northflank Dashboard:**

1. Go to **colmap-worker-gpu** service
2. **Settings** → **Build**
3. Change **Build Type** to **"External Image"**
4. Set **Image**:
   ```
   ghcr.io/marco-interact/colmap-mvp:latest
   ```
5. **Save** and click **"Deploy"**

---

## ⏱️ Build Time

**Local build:** ~15-20 minutes (first time)

**Components being built:**
- CUDA base image (1.1GB)
- Python + dependencies
- COLMAP from apt
- Open3D library
- Application code
- Demo resources

**Subsequent builds:** ~5-10 minutes (with Docker cache)

---

## 🐛 Troubleshooting

### Docker Not Installed

**macOS:**
```bash
brew install --cask docker
```

**Windows:**
Download from: https://www.docker.com/products/docker-desktop

**Linux:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### "Permission Denied" Error

```bash
# macOS/Linux: Start Docker Desktop app
# OR
sudo chmod 666 /var/run/docker.sock
```

### Build Fails - Out of Disk Space

```bash
# Clean up old images
docker system prune -a

# Check disk space
df -h
```

### Push Fails - Authentication Error

**Check:**
1. Token has `write:packages` scope
2. Using correct GitHub username
3. Token hasn't expired

**Re-generate token:**
https://github.com/settings/tokens/new?scopes=write:packages

### Image Too Large

**Current size:** ~2-3 GB

**To check:**
```bash
docker images ghcr.io/marco-interact/colmap-mvp:latest
```

**Not a problem** - Northflank and GitHub support large images

---

## 🔄 Update Workflow

### When You Make Code Changes:

```bash
# 1. Make changes
vim main.py

# 2. Build new image
docker build -t colmap-mvp:latest .

# 3. Tag and push
docker tag colmap-mvp:latest ghcr.io/marco-interact/colmap-mvp:latest
docker push ghcr.io/marco-interact/colmap-mvp:latest

# 4. Redeploy in Northflank
# Dashboard → colmap-worker-gpu → Redeploy
```

### Automated Update Script:

```bash
#!/bin/bash
# save as: update.sh

docker build -t colmap-mvp:latest .
docker tag colmap-mvp:latest ghcr.io/marco-interact/colmap-mvp:latest
docker push ghcr.io/marco-interact/colmap-mvp:latest

echo "✅ Image updated! Redeploy in Northflank dashboard."
```

---

## 🎯 Verify Deployment

After Northflank pulls the new image:

```bash
# Check backend health
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/health

# Expected response:
# {"status":"healthy","service":"colmap-worker","version":"2.0-gpu"}

# Check demo project
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/projects

# Should show Demo Showcase Project with 2 scans
```

---

## 📊 Comparison

### Before (Building on Northflank):
```
Push → Northflank Build → FAILS (I/O error) ❌
Time: 0 (never succeeds)
```

### After (Pre-Built Image):
```
Local Build → Push to GHCR → Northflank Pull → Deploy ✅
Time: 20 min (first time) + 2 min (deploy)
```

---

## ✅ Checklist

- [ ] Docker installed locally
- [ ] GitHub Personal Access Token created
- [ ] Build image locally (`./build-and-push.sh`)
- [ ] Push to GHCR successful
- [ ] Package made public on GitHub
- [ ] Northflank configured to use external image
- [ ] Deployed and tested
- [ ] Demo project accessible

---

## 🎉 Result

Once completed:
- ✅ No more Northflank build errors
- ✅ Reliable deployments
- ✅ Demo project working
- ✅ Open3D features available
- ✅ Full control over build process

---

## 📞 Need Help?

**If build fails locally:**
1. Check Docker is running
2. Check disk space (`df -h`)
3. Try: `docker system prune -a`
4. Restart Docker Desktop

**If push fails:**
1. Re-generate GitHub token
2. Check internet connection
3. Verify GitHub username

**If Northflank can't pull:**
1. Make package public
2. Check image URL is correct
3. Try manual pull test:
   ```bash
   docker pull ghcr.io/marco-interact/colmap-mvp:latest
   ```

