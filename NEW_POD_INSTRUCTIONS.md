# New Pod Setup Instructions

## Pod: t2tuuwh2z4hrlz

---

## Step 1: SSH Into Pod

Connect via RunPod web terminal or SSH.

---

## Step 2: Verify Volume is Mounted

```bash
mount | grep /workspace
df -h /workspace
```

**Expected:** You should see the volume mounted at `/workspace`.

---

## Step 3: Run Complete Setup Script

```bash
cd /workspace
curl -s https://raw.githubusercontent.com/marco-interact/colmap-mvp/main/RUNPOD_NEW_POD_SETUP.sh | bash
```

Or manually:

```bash
cd /workspace
git clone https://github.com/marco-interact/colmap-mvp.git
cd colmap-mvp

# Setup Python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Install COLMAP
bash runpod-install-colmap.sh

# Start backend
nohup python main.py > backend.log 2>&1 &
sleep 6
tail -n 120 backend.log
```

---

## Step 4: Verify Everything Works

```bash
# Backend health
curl http://localhost:8000/health

# Demo data
curl http://localhost:8000/api/projects
```

**Expected:** Should return 1 project with 2 scans.

---

## Step 5: Setup Cloudflare Tunnel

```bash
pkill -f cloudflared || true
nohup cloudflared tunnel --url http://localhost:8000 --protocol quic > /tmp/cloudflared.log 2>&1 &
sleep 8
grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' /tmp/cloudflared.log | head -1
```

**Copy the URL** - you'll need to update Vercel with this new tunnel URL!

---

## Step 6: Update Vercel

The tunnel URL will be different. Get it from Step 5, then:

1. Update Vercel env var: `NEXT_PUBLIC_API_URL` = new tunnel URL
2. Redeploy Vercel

---

## Quick Commands for Future

### Pull Latest Code

```bash
cd /workspace/colmap-mvp && \
git fetch origin && git reset --hard origin/main && \
source venv/bin/activate && \
pkill -f "python.*main.py" || true && \
nohup python main.py > backend.log 2>&1 & sleep 6 && \
curl -s http://localhost:8000/health
```

### Restart Backend

```bash
cd /workspace/colmap-mvp
source venv/bin/activate
pkill -f "python.*main.py" || true
nohup python main.py > backend.log 2>&1 &
```

### Check Logs

```bash
tail -f /workspace/colmap-mvp/backend.log
```

---

## Verification Checklist

- [ ] Volume mounted at `/workspace`
- [ ] Code cloned from GitHub
- [ ] Python dependencies installed
- [ ] COLMAP installed
- [ ] Database initialized
- [ ] Demo data created (1 project, 2 scans)
- [ ] Backend running on port 8000
- [ ] Health endpoint returns 200
- [ ] API returns demo projects
- [ ] Cloudflare tunnel active
- [ ] Vercel updated with new tunnel URL

---

**Status:** Setup in progress... ⏳

