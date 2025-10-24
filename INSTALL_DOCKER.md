# Install Docker Desktop - Quick Guide

## 📥 Download & Install

### Option 1: Direct Download (FASTEST - 5 minutes)

1. **Download Docker Desktop for Mac (Apple Silicon):**
   https://desktop.docker.com/mac/main/arm64/Docker.dmg

2. **Install:**
   - Open the downloaded `Docker.dmg`
   - Drag Docker.app to Applications folder
   - Open Docker from Applications
   - Grant necessary permissions when prompted
   - Wait for Docker to start (whale icon in menu bar)

### Option 2: Homebrew (from Terminal)

```bash
# Run this command in a NEW terminal (not in Cursor)
brew install --cask docker

# Then start Docker Desktop from Applications
open -a Docker
```

---

## ✅ Verify Installation

After Docker Desktop starts (whale icon appears in top menu bar):

```bash
# Test Docker is working
docker --version

# Expected output:
# Docker version 24.x.x, build xxxxx
```

---

## 🚀 Run the Build Script

Once Docker is running:

```bash
# Navigate to project
cd /Users/marco.aurelio/Desktop/colmap-mvp

# Run the build script
./build-and-push.sh
```

**You'll need:**
- GitHub username: `marco-interact`
- GitHub Personal Access Token: Create at https://github.com/settings/tokens/new?scopes=write:packages

---

## ⏱️ Timeline

1. **Download Docker:** 2-3 minutes
2. **Install & Start:** 2-3 minutes  
3. **Build Image:** 15-20 minutes
4. **Push to GitHub:** 2-3 minutes

**Total:** ~25 minutes

---

## 🐛 Troubleshooting

### Docker Won't Start

- Check System Requirements: macOS 11+ with Apple Silicon
- Restart Mac
- Check: **System Settings** → **Privacy & Security** → Allow Docker

### "Cannot connect to Docker daemon"

```bash
# Make sure Docker Desktop is running
open -a Docker

# Wait for whale icon in menu bar
# Then try again
```

### Build Fails - Out of Space

```bash
# Clean up Docker
docker system prune -a

# Check available space (need ~10GB)
df -h
```

---

## 📞 Alternative: Skip Local Build

If you prefer not to build locally, you can:

1. **Use GitHub Codespaces** (cloud-based, free for 60 hours/month):
   - Go to: https://github.com/marco-interact/colmap-mvp
   - Click **Code** → **Codespaces** → **Create codespace**
   - Run `./build-and-push.sh` in the Codespace terminal

2. **Use a Cloud VM** (AWS/GCP/Azure):
   - Spin up Ubuntu VM with Docker
   - Clone repo
   - Run build script

---

## ✅ Next Steps After Docker is Installed

```bash
# 1. Verify Docker
docker --version

# 2. Build and push
./build-and-push.sh

# 3. Update Northflank to use pre-built image
# (Instructions in MANUAL_DOCKER_BUILD.md)
```

