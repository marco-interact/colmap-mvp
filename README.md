# COLMAP MVP - 3D Reconstruction Platform

A videogrammetry platform using COLMAP for 3D reconstruction from video files.

## 🚀 Quick Start

### One-Command Startup

```bash
./start-local.sh
```

Then open your browser to: **http://localhost:3000**

That's it! Everything runs through port 3000.

### Login

Use the demo account:
- Email: `demo@colmap.app`

## 🏗️ Architecture

- **Frontend**: Next.js on port 3000 (User-facing)
- **Backend**: FastAPI on port 8080 (Internal API, proxied through Next.js)
- **Database**: SQLite (Local file storage)

**You only need to remember: `http://localhost:3000`**

The Next.js frontend automatically proxies all backend API calls internally.

## 📦 Demo Data

The app includes 2 pre-configured demo scans:
1. **Dollhouse Scan** - Interior residential space
2. **Fachada Scan** - Building facade

## 🛑 Stop Services

```bash
lsof -ti:8080 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

## 📁 Project Structure

```
colmap-mvp/
├── src/                    # Next.js frontend
│   ├── app/               # App routes and pages
│   ├── components/        # React components
│   └── lib/               # API client and utilities
├── scripts/               # Utility scripts
│   ├── test/             # Test scripts
│   └── diagnostics/      # Diagnostic scripts
├── docs/                  # Documentation (organized by date)
│   ├── 2025-10-22/       # Latest session
│   ├── 2025-10-21/       # Previous work
│   └── logs/             # Historical logs
├── main.py                # FastAPI backend
├── database.py            # SQLite database
├── demo-resources/        # Demo 3D models and thumbnails
└── start-local.sh         # One-command startup script
```

## 🔧 Manual Setup (if needed)

### Prerequisites
- Python 3.13+
- Node.js 18+
- COLMAP (optional, for actual processing)

### Install Dependencies

```bash
# Backend
python3 -m venv venv-local
source venv-local/bin/activate
pip install -r requirements.txt

# Frontend
npm install
```

### Start Services Manually

```bash
# Terminal 1 - Backend
source venv-local/bin/activate
python3 main.py

# Terminal 2 - Frontend
npm run dev
```

## 📝 Features

- ✅ Upload video files for 3D reconstruction
- ✅ Real-time processing status
- ✅ View completed 3D models
- ✅ Project and scan management
- ✅ Demo scans with pre-loaded 3D models

## 🎯 Usage

1. Open http://localhost:3000
2. Login with demo@colmap.app
3. View demo project with 2 completed scans
4. Click any scan to view its 3D model
5. Upload your own videos for processing

## 💾 Data Storage

- **Database**: `/tmp/colmap_app.db`
- **Results**: `./data/results/`
- **Uploads**: `./data/uploads/`
- **Demo Resources**: `./demo-resources/`

## 🧪 Development

### View Logs
```bash
# Backend logs
tail -f backend.log

# Frontend logs
tail -f frontend.log
```

### Testing
```bash
# Test COLMAP pipeline
./scripts/test/test-colmap-simple.sh

# Test database
./scripts/test/test-database.sh

# Run diagnostics
./scripts/diagnostics/diagnose-colmap.sh
```

### Reset Demo Data
```bash
curl -X POST http://localhost:3000/api/backend/database/setup-demo
```

### Documentation
All documentation is organized in `docs/` by date:
- **Latest:** `docs/2025-10-22/SESSION_SUMMARY.md`
- **Full index:** `docs/README.md`

## 🐛 Troubleshooting

**Backend won't start?**
```bash
# Check if port is in use
lsof -ti:8080

# View logs
cat backend.log
```

**Frontend won't start?**
```bash
# Check if port is in use
lsof -ti:3000

# View logs
cat frontend.log
```

**Can't see demo scans?**
```bash
# Reinitialize demo data
curl -X POST http://localhost:3000/api/backend/database/setup-demo
```

## 📄 License

MIT License
# Force rebuild - Fri Oct 24 01:51:45 CST 2025
# Frontend Dockerfile config applied - Fri Oct 24 02:00:51 CST 2025
# INTEGRATION: Complete COLMAP + Open3D + Three.js integration with GPU optimization - Fri Oct 24 02:45:35 CST 2025
# NUCLEAR BUILD COMPLETE: Fri Oct 24 04:17:59 CST 2025
