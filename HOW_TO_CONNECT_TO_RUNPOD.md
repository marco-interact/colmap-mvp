# How to Connect to RunPod Pod

## Your Pod Details

**Pod ID:** emdu0sce5iq5zn  
**Pod Name:** colmap-worker-gpu  
**HTTP Port:** 8000 ✅ Ready

---

## Option 1: Enable Web Terminal (EASIEST)

1. **In the RunPod UI**, find the **"Web Terminal"** section
2. **Toggle the "Enable Web Terminal" switch to ON** (should turn green)
3. Wait a few seconds for it to start
4. Click the terminal icon/button to open
5. If it still doesn't work, try Option 2

---

## Option 2: SSH (MOST RELIABLE)

### Step 1: Setup SSH Key

If you don't have an SSH key:

```bash
# On your LOCAL computer
ssh-keygen -t ed25519 -C "your_email@example.com"
# Accept default location: ~/.ssh/id_ed25519
# Press Enter for no passphrase (or set one if you want)

# Copy your public key
cat ~/.ssh/id_ed25519.pub
```

### Step 2: Add SSH Key to RunPod

1. Go to RunPod Dashboard → **Settings** → **SSH Keys**
2. Click **"Add SSH Key"**
3. Paste the public key from Step 1
4. Click **"Save"**

### Step 3: Connect via SSH

```bash
# On your LOCAL computer
ssh emdu0sce5iq5zn-644114f6@ssh.runpod.io -i ~/.ssh/id_ed25519

# If key is in default location, you can omit -i:
ssh emdu0sce5iq5zn-644114f6@ssh.runpod.io
```

---

## Option 3: Use RunPod's SSH Button

1. In RunPod UI, click the **"Copy"** button next to the SSH command
2. Paste it into your local terminal
3. Press Enter

---

## Once Connected, Run Setup

### Quick Setup Command

```bash
cd /workspace && \
git clone https://github.com/marco-interact/colmap-mvp.git && \
cd colmap-mvp && \
python3 -m venv venv && \
source venv/bin/activate && \
pip install -r requirements.txt && \
bash runpod-install-colmap.sh && \
nohup python main.py > backend.log 2>&1 & sleep 10 && \
curl -s http://localhost:8000/health
```

### Or Step-by-Step

```bash
# 1. Clone repo
cd /workspace
git clone https://github.com/marco-interact/colmap-mvp.git
cd colmap-mvp

# 2. Setup Python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Install COLMAP
bash runpod-install-colmap.sh

# 4. Start backend
nohup python main.py > backend.log 2>&1 & sleep 8

# 5. Check logs
tail -n 100 backend.log

# 6. Verify backend
curl http://localhost:8000/health
curl http://localhost:8000/api/projects
```

---

## Verify Backend is Running

```bash
# Should return: {"status":"healthy","message":"Backend is running","database_path":"/workspace/database.db"}
curl http://localhost:8000/health

# Should return: 1 project with 2 scans
curl http://localhost:8000/api/projects
```

---

## Setup Cloudflare Tunnel

```bash
# Kill old tunnel
pkill -f cloudflared || true

# Start new tunnel
nohup cloudflared tunnel --url http://localhost:8000 --protocol quic > /tmp/cloudflared.log 2>&1 &

# Wait for URL
sleep 10
grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' /tmp/cloudflared.log | head -1
```

**Copy that URL** - you need to update Vercel with it!

---

## Troubleshooting

### "Permission denied" when SSHing
- Check SSH key is added to RunPod
- Try: `ssh -v emdu0sce5iq5zn-644114f6@ssh.runpod.io` (verbose mode)

### "Connection refused"
- Pod might be sleeping - wake it from dashboard
- HTTP shows "Ready" so backend should be accessible

### Web Terminal won't start
- Use SSH instead
- Try refreshing the page
- Check browser console for errors

---

**RECOMMENDED: Use SSH (Option 2) - it's most reliable!**

