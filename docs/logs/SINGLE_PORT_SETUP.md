# ✅ Single Port Setup Complete

## Summary

Your COLMAP MVP now runs entirely through **ONE PORT: 3000**

All Northflank deployment files have been removed. This is now a local-only development setup.

## What Changed

### ✅ Removed (Northflank deployment files)
- ❌ `Dockerfile.northflank`
- ❌ `Dockerfile.frontend`
- ❌ `northflank.json`
- ❌ `northflank-backend.json`
- ❌ `northflank-frontend.json`
- ❌ All `NORTHFLANK_*.md` documentation
- ❌ All `DEPLOYMENT_*.md` files
- ❌ Deployment scripts

### ✅ Added/Updated
- ✨ `start-local.sh` - One command to start everything
- ✨ `next.config.js` - API proxy configuration
- ✨ `src/lib/api.ts` - Updated to use `/api/backend` proxy
- ✨ `README.md` - Simplified documentation

## Architecture

```
┌─────────────────────────────────────────┐
│  Browser                                 │
│  http://localhost:3000                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Next.js Frontend (Port 3000)           │
│  - Serves UI                             │
│  - Proxies /api/backend/* to port 8080  │
└──────────────┬──────────────────────────┘
               │ (internal)
               ▼
┌─────────────────────────────────────────┐
│  FastAPI Backend (Port 8080)            │
│  - Handles COLMAP processing             │
│  - SQLite database                       │
└─────────────────────────────────────────┘
```

## How to Use

### Start Everything
```bash
./start-local.sh
```

### Access the App
Open browser: **http://localhost:3000**

Login: `demo@colmap.app`

### View Logs
```bash
# Backend logs
tail -f backend.log

# Frontend logs
tail -f frontend.log
```

### Stop Services
```bash
lsof -ti:8080 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

## Demo Scans Available

✅ **2 Pre-loaded Demo Scans:**
1. **Dollhouse Scan** - Interior residential space
2. **Fachada Scan** - Building facade

Both scans are in "completed" status and ready to view.

## API Endpoints (through port 3000)

All backend APIs are now accessed via port 3000:

```bash
# Health check
curl http://localhost:3000/api/backend/health

# Get projects
curl http://localhost:3000/api/backend/projects

# Get scans
curl http://localhost:3000/api/backend/projects/{project_id}/scans
```

## No More Port Confusion!

- ❌ ~~http://localhost:8080~~ (You don't need to access this directly)
- ✅ **http://localhost:3000** (Your only URL)

The Next.js server automatically routes API calls to the backend internally.


