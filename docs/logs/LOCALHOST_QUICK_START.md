# 🚀 COLMAP MVP - Localhost Quick Start

## ✅ Status: FULLY WORKING!

Both frontend and backend are now running on localhost.

---

## 🌐 Localhost URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main web application |
| **Backend API** | http://localhost:8080 | FastAPI server |
| **API Docs** | http://localhost:8080/docs | Interactive API documentation |

---

## 🎯 Quick Start

### Option 1: Use the Startup Script (Recommended)
```bash
./start-local.sh
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
source venv-local/bin/activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

---

## 🛠️ What's Fixed

### ✅ Issues Resolved:
1. **Missing GET /projects endpoint** - Added
2. **Missing database methods** - Added `get_all_projects()` and `get_project_by_id()`
3. **Missing @tailwindcss/forms** - Installed
4. **3D Viewer** - Fixed and simplified
5. **Progress Bar** - Added to scan cards
6. **Storage Persistence** - Database-backed job storage working
7. **Demo Mode** - Removed, full CRUD functionality enabled

### 🎨 Features Working:
- ✅ Create/view projects
- ✅ Upload videos for processing
- ✅ Real-time progress tracking
- ✅ 3D point cloud viewer
- ✅ Interactive 3D controls (orbit, zoom, pan)
- ✅ Persistent storage (SQLite database)
- ✅ Full COLMAP pipeline (CPU-optimized for M2)

---

## 📊 System Info

- **Platform:** Apple M2 (16GB RAM)
- **Mode:** CPU-only (no GPU required)
- **Database:** SQLite (`/tmp/colmap_app.db`)
- **Storage:** Local filesystem (`./data/`)

### Optimized Settings for M2:
- Max frames: 15 (low), 25 (medium), 40 (high)
- Max image size: 1200px (CPU)
- Features: 8192 max
- Matches: 16384 max

---

## 🔧 Troubleshooting

### If frontend shows "Internal Server Error":
```bash
# Check logs
tail -f frontend.log

# Restart frontend
lsof -ti:3000 | xargs kill -9
npm run dev
```

### If backend not responding:
```bash
# Check logs
tail -f backend.log

# Restart backend
lsof -ti:8080 | xargs kill -9
source venv-local/bin/activate
python main.py
```

### Clean restart everything:
```bash
# Kill all processes
lsof -ti:8080,3000 | xargs kill -9

# Restart
./start-local.sh
```

---

## 📝 Log Files

View real-time logs:
```bash
# Backend logs
tail -f backend.log

# Frontend logs
tail -f frontend.log
```

---

## 🎥 Workflow

1. **Open Browser:** http://localhost:3000
2. **Create Project:** Click "New Project" button
3. **Upload Video:** Select project → "New Scan" → Upload video file
4. **Track Progress:** Watch real-time progress bar
5. **View 3D Model:** When complete, click scan to view point cloud
6. **Interact:** Use mouse to orbit, zoom, pan 3D model

---

## 💾 Data Storage

| Type | Location |
|------|----------|
| Database | `/tmp/colmap_app.db` |
| Uploads | `./data/uploads/` |
| Results | `./data/results/{job_id}/` |
| Cache | `./data/cache/` |

---

## ⚡ Performance Tips

- **Low quality:** Fast processing, lower detail (15 frames)
- **Medium quality:** Balanced (25 frames) - Recommended for M2
- **High quality:** Best detail, slower (40 frames)

For best results on M2 16GB:
- Use medium quality
- Keep videos under 30 seconds
- Avoid running other heavy apps during processing

---

## 🐛 Common Errors & Fixes

### Port Already in Use
```bash
lsof -ti:8080 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Missing Dependencies
```bash
# Frontend
npm install

# Backend
source venv-local/bin/activate
pip install -r requirements.txt
```

### Virtual Environment Not Found
```bash
python3 -m venv venv-local
source venv-local/bin/activate
pip install -r requirements.txt
```

---

## 📚 Next Steps

1. **Test Upload:** Try uploading a short video (5-10 seconds)
2. **Check Processing:** Monitor progress in real-time
3. **View Results:** Explore the 3D point cloud
4. **Experiment:** Try different quality settings

---

## ✨ You're All Set!

Your COLMAP MVP is fully functional on localhost. Enjoy creating 3D reconstructions! 🎉



