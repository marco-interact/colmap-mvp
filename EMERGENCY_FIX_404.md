# EMERGENCY: 404 Error Fix

**Issue:** Frontend getting 404 on API calls  
**Priority:** 🔴 CRITICAL

---

## ⚡ IMMEDIATE FIX

### Step 1: Start Backend on RunPod

```bash
cd /workspace/colmap-mvp
source venv/bin/activate
nohup python main.py > backend.log 2>&1 &
sleep 5
tail -30 backend.log
```

### Step 2: Verify Backend

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/projects
```

**Expected:** JSON response with projects

### Step 3: Start Cloudflare Tunnel

```bash
# Kill old tunnel
pkill cloudflared

# Start new tunnel
nohup cloudflared tunnel --url http://localhost:8000 > /tmp/tunnel.log 2>&1 &

# Get URL
sleep 10
grep "trycloudflare.com" /tmp/tunnel.log | tail -1
```

### Step 4: Update Vercel Environment

Copy the Cloudflare URL and update Vercel:

```bash
vercel env add NEXT_PUBLIC_API_URL production
# Paste: https://[your-tunnel].trycloudflare.com
```

### Step 5: Redeploy Frontend

```bash
vercel --prod
```

---

## 🔍 Why This Happens

1. **Backend not running** - 404 error
2. **Cloudflare tunnel down** - Cannot reach backend
3. **Wrong environment variable** - Frontend calls wrong URL
4. **Frontend needs rebuild** - Old config cached

---

## ✅ Success Criteria

After fix:
- ✅ Backend running (PID visible)
- ✅ Health check returns 200
- ✅ Projects API returns JSON
- ✅ Cloudflare tunnel active
- ✅ Frontend can reach backend

---

**FIXED!** ✅


