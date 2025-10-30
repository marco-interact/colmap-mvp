# Port Configuration Fix

## Problem

- **RunPod pod** is configured for port **8888**
- **Backend app** expects port **8000**
- **Mismatch!**

---

## Solution: Change Backend to Use Port 8888

Since RunPod is ready on port 8888, let's make the backend listen on that port.

---

## Update main.py

Change line 580 in `main.py`:

**FROM:**
```python
uvicorn.run(app, host="0.0.0.0", port=8000)
```

**TO:**
```python
uvicorn.run(app, host="0.0.0.0", port=8888)
```

---

## Or Change RunPod Port Setting

In RunPod Dashboard:
1. Go to your pod
2. Click **Edit Pod**
3. Change **HTTP Port** from 8888 to 8000
4. **Save** (pod will restart)
5. Wait for it to be ready

---

## Recommended: Use RunPod's Port

Since port 8888 is already ready, let's use that.

---

**Option 1:** Edit main.py to use port 8888 (simpler)

**Option 2:** Edit RunPod pod to use port 8000 (requires restart)

**Which do you prefer?**

