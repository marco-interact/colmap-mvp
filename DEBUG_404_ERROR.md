# Debug 404 Error

**Issue:** Frontend getting 404 errors when calling backend API  
**Date:** October 29, 2025

---

## 🔍 Current Configuration

### Frontend (src/lib/api.ts)
```typescript
baseUrl = '/api/backend'  // Next.js proxy
request('/api/projects')  // API endpoint
// Final URL: /api/backend/api/projects
```

### Next.js Rewrite (next.config.js)
```javascript
{
  source: '/api/backend/:path*',
  destination: `${backendUrl}/api/:path*`,
}
// Maps: /api/backend/api/projects → http://localhost:8000/api/projects
```

### Backend (main.py)
```python
@app.get("/api/projects")
async def get_projects():
    # Returns projects
```

**This should work!** ✅

---

## 🐛 Debugging Steps

### 1. Check Backend is Running

```bash
# On RunPod
cd /workspace/colmap-mvp
ps aux | grep "python.*main.py"
tail -30 backend.log
curl http://localhost:8000/health
```

### 2. Check Environment Variable

**On Vercel:**
```bash
vercel env ls
```

**Should have:**
```
NEXT_PUBLIC_API_URL = [Cloudflare tunnel URL]
```

### 3. Check Actual Request URL

Open browser console and check what URL is being requested:
```
console.log('Request URL:', url)
```

**Look for:**
- Correct: `/api/backend/api/projects`
- Wrong: `/api/projects` (missing /api/backend)

### 4. Test Backend Directly

```bash
# From RunPod
curl http://localhost:8000/api/projects
```

**Expected:**
```json
{
  "projects": [
    {
      "id": "...",
      "name": "Reconstruction Test Project 1"
    }
  ]
}
```

### 5. Test Through Next.js Proxy

```bash
# From local machine (if backend reachable)
curl http://localhost:3000/api/backend/api/projects
```

**Expected:** Same as direct backend

---

## 🔧 Common Issues

### Issue 1: Backend Not Running
**Symptom:** 404 error  
**Fix:** Start backend on RunPod

### Issue 2: Wrong Environment Variable
**Symptom:** 404 error  
**Fix:** Set `NEXT_PUBLIC_API_URL` correctly

### Issue 3: Cloudflare Tunnel Not Running
**Symptom:** 404 or connection error  
**Fix:** Restart cloudflared tunnel

### Issue 4: Wrong API Path
**Symptom:** 404 error  
**Fix:** Check frontend is using `/api/backend` prefix

---

## 📋 Quick Fix Commands

### On RunPod

```bash
# 1. Start backend
cd /workspace/colmap-mvp
source venv/bin/activate
nohup python main.py > backend.log 2>&1 &

# 2. Start Cloudflare tunnel (if using public URL)
cloudflared tunnel --url http://localhost:8000

# 3. Check everything
sleep 3
curl http://localhost:8000/health
curl http://localhost:8000/api/projects
```

### On Vercel

```bash
# Redeploy frontend
vercel --prod
```

---

## ✅ Expected Behavior

**Backend Response:**
```
http://localhost:8000/api/projects
→ 200 OK
→ { "projects": [...] }
```

**Frontend Request:**
```
/api/backend/api/projects
→ Next.js rewrite
→ http://[backend-url]/api/projects
→ 200 OK
→ { "projects": [...] }
```

---

## 🎯 Next Steps

1. **Check backend is running**
2. **Verify environment variable**
3. **Test direct backend call**
4. **Check browser console for actual URL**
5. **Redeploy frontend if needed**

---

**Need more info?** Check backend logs and browser console for exact error messages.

