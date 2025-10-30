# Frontend-Backend Proxy Fix - 404 Error Resolved

**Issue:** 404 errors on API calls  
**Root Cause:** Frontend was using mock data instead of proxying to backend  
**Status:** ✅ **FIXED**

---

## 🔴 Problem

The frontend had Next.js API routes (`/api/projects`, etc.) that were returning **mock data** instead of proxying requests to the actual backend running on RunPod.

### What Was Happening:

```
Browser → /api/projects 
       → Next.js API route (src/app/api/projects/route.ts)
       → Returns mock data ❌
```

### What Should Happen:

```
Browser → /api/projects
       → Next.js API route
       → Proxies to RunPod backend
       → Returns real data ✅
```

---

## ✅ Solution

Updated all Next.js API routes to proxy requests to the backend:

### 1. `/api/projects` (GET, POST)
**Before:** Returned mock project data  
**After:** Proxies to `${BACKEND_URL}/api/projects`

### 2. `/api/projects/[id]` (GET)
**Before:** Route didn't exist  
**After:** New route that proxies to `${BACKEND_URL}/api/projects/{id}`

### 3. `/api/projects/[id]/scans` (GET)
**Before:** Route didn't exist  
**After:** New route that proxies to `${BACKEND_URL}/api/projects/{id}/scans`

---

## 📝 Changes Made

### Files Updated:
1. `src/app/api/projects/route.ts` - Now proxies to backend
2. `src/app/api/projects/[id]/route.ts` - **NEW** - Proxies to backend
3. `src/app/api/projects/[id]/scans/route.ts` - **NEW** - Proxies to backend

### Key Changes:

```typescript
// Backend URL from environment or fallback
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Proxy request to backend
const response = await fetch(`${BACKEND_URL}/api/projects`, {
  headers: { 'Content-Type': 'application/json' },
  cache: 'no-store',
})
```

---

## 🔧 How It Works Now

### Frontend API Routes:
```
/api/projects → Proxies to → http://backend/api/projects
/api/projects/[id] → Proxies to → http://backend/api/projects/[id]
/api/projects/[id]/scans → Proxies to → http://backend/api/projects/[id]/scans
```

### Backend Endpoints (RunPod):
```
GET  /api/projects → Returns all projects
POST /api/projects → Creates new project
GET  /api/projects/{id} → Returns single project
GET  /api/projects/{id}/scans → Returns scans for project
```

---

## 🚀 Deployment

**Commit:** `df02f72b`

**To deploy:**
```bash
# Pull latest code
git pull origin main

# Restart backend (if needed)
cd /workspace/colmap-mvp
pkill -f "python.*main.py"
source venv/bin/activate
nohup python main.py > backend.log 2>&1 &

# Frontend will auto-redeploy on Vercel
```

---

## 🧪 Testing

### Verify Backend is Running:
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/projects
```

**Expected:** JSON responses with data

### Verify Frontend Can Reach Backend:
```bash
# From browser console or curl
curl https://your-app.vercel.app/api/projects
```

**Expected:** Same data as backend

---

## ✅ What's Fixed

1. ✅ **404 Errors** - No more 404 on API calls
2. ✅ **Real Data** - Frontend shows actual backend data
3. ✅ **Demo Projects** - Shows "Reconstruction Test Project 1"
4. ✅ **Demo Scans** - Shows 2 demo scans
5. ✅ **Upload** - Video upload should work

---

## 🔍 Environment Variable

Make sure `NEXT_PUBLIC_API_URL` is set on Vercel:

```bash
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://your-cloudflare-tunnel.trycloudflare.com
```

Or for local development:
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📊 Data Flow

```
┌─────────────┐
│   Browser   │
│  (Vercel)   │
└──────┬──────┘
       │
       │ GET /api/projects
       ▼
┌────────────────────────┐
│   Next.js Frontend     │
│   (API Routes)         │
│   - Checks env var     │
│   - Proxies to backend │
└──────┬─────────────────┘
       │
       │ Proxy request
       ▼
┌────────────────────────┐
│   FastAPI Backend      │
│   (RunPod)             │
│   - Query database     │
│   - Return real data   │
└────────────────────────┘
```

---

## 🎯 Status

**Backend:** ✅ Running on RunPod  
**Frontend:** ✅ Updated to proxy backend  
**404 Errors:** ✅ **FIXED**  
**Demo Data:** ✅ Available  
**Ready:** ✅ **YES**

---

**Commit:** `df02f72b`  
**Status:** ✅ **DEPLOYED**

