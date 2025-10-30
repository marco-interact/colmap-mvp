# 🚀 RunPod GPU Deployment - Quick Start

## Prerequisites

1. ✅ **RunPod Account** - https://runpod.io
2. ✅ **SSH Key** - Already generated at `~/.ssh/id_ed25519_interact`
3. ✅ **RunPod Pod** - RTX 4090 with PyTorch template

## Step 1: Create RunPod Pod

1. Go to https://www.runpod.io/console/pods
2. Click **"Deploy"** → **"GPU Pod"**
3. Configure:
   - **GPU**: RTX 4090 (24 GB VRAM)
   - **Template**: RunPod PyTorch 2.8.0
   - **SSH Public Key**: Paste your SSH public key:
     ```bash
     cat ~/.ssh/id_ed25519_interact.pub
     ```
   - **Ports**: 
     - 8000 (Backend API)
     - 3000 (Optional - if running frontend)
   - **Pricing**: On-Demand ($0.59/hr) or Spot ($0.29/hr)
4. Click **"Deploy"** and wait ~2 minutes

## Step 2: Get Your Pod IP

Once deployed, copy your pod's **Public IP** or **Endpoint URL** from the RunPod dashboard.

Example: `abc123xyz.runpod.io` or `123.45.67.89`

## Step 3: Connect to RunPod

### Option A: Use the connection script
```bash
./connect-runpod.sh
# Enter your RunPod IP when prompted
```

### Option B: Manual SSH connection
```bash
ssh -i ~/.ssh/id_ed25519_interact root@<your-runpod-ip>
```

## Step 4: Deploy Your Backend

### Option A: Automated deployment
```bash
./deploy-runpod.sh <your-runpod-ip>
```

This script will:
- ✅ Upload all necessary files
- ✅ Install COLMAP and dependencies
- ✅ Set up Python environment
- ✅ Install all requirements

### Option B: Manual deployment

1. **Connect to RunPod:**
   ```bash
   ssh -i ~/.ssh/id_ed25519_interact root@<your-runpod-ip>
   ```

2. **Clone your repository:**
   ```bash
   cd /workspace
   git clone https://github.com/marco-interact/colmap-mvp.git
   cd colmap-mvp
   ```

3. **Install COLMAP (if not pre-installed):**
   ```bash
   apt-get update
   apt-get install -y colmap
   ```

4. **Set up Python environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

5. **Start the backend:**
   ```bash
   python main.py
   ```

## Step 5: Access Your API

Your backend will be available at:
```
http://<your-runpod-ip>:8000
```

### Test Endpoints:
```bash
# Health check
curl http://<your-runpod-ip>:8000/health

# COLMAP check
curl http://<your-runpod-ip>:8000/colmap/check
```

## Step 6: Configure Frontend

Update your Vercel environment variable:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Set `NEXT_PUBLIC_API_URL` to:
   ```
   http://<your-runpod-ip>:8000
   ```
3. Redeploy frontend (or it will auto-deploy)

## 🔧 Useful RunPod Commands

### Check GPU Status
```bash
nvidia-smi
```

### Check COLMAP Installation
```bash
colmap -h
```

### View Running Processes
```bash
ps aux | grep python
```

### Check Ports
```bash
netstat -tulpn | grep LISTEN
```

### View Logs
```bash
tail -f /workspace/colmap-demo/backend.log
```

## 🛑 Stopping Your Pod

**Important**: RunPod charges hourly for pods, even if idle.

To stop billing:
1. Go to RunPod Dashboard → Pods
2. Click on your pod
3. Click **"Stop"** or **"Terminate"**
   - **Stop**: Preserves pod state (charges less but still costs)
   - **Terminate**: Completely removes pod (no charges)

## 💰 Cost Optimization

- **Spot Instances**: 50% cheaper ($0.29/hr) but can be interrupted
- **Stop When Idle**: Stop pods when not processing
- **Schedule Jobs**: Only start pods when needed
- **Estimated Cost**: $0.59/hour ≈ $14/day if running 24/7

## 🐛 Troubleshooting

### Connection Refused
- Verify SSH key is added to RunPod
- Check pod status (should be "Running")
- Verify IP address is correct

### Port Not Accessible
- Ensure port 8000 is exposed in RunPod settings
- Check firewall rules
- Verify service is running: `curl localhost:8000/health`

### COLMAP Not Found
```bash
# Install COLMAP
apt-get update && apt-get install -y colmap
```

### Out of Memory
- RTX 4090 has 24GB VRAM - should be sufficient
- Check GPU usage: `nvidia-smi`
- Consider reducing batch sizes in COLMAP config

## 📝 Your SSH Public Key

Add this to RunPod dashboard:
```bash
cat ~/.ssh/id_ed25519_interact.pub
```

---

**Ready to deploy?** Get your RunPod IP and run:
```bash
./deploy-runpod.sh <your-runpod-ip>
```


