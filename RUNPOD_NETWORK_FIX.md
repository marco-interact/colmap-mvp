RunPod Network Fix - Make Backend Accessible to Vercel
=========================================================

PROBLEM:
The frontend on Vercel gets "502 Bad Gateway" because it can't reach your RunPod backend.

ISSUE:
RunPod IP 213.181.111.2 might not be publicly accessible from Vercel's servers.

SOLUTION OPTIONS:

Option 1: Use RunPod's HTTP Port Exposure (Recommended)
--------------------------------------------------------
1. In RunPod dashboard, edit your pod
2. Find "Expose HTTP Ports" section
3. Add port 8000
4. Save - RunPod will give you a public URL like: https://xxxxx.proxy.runpod.io
5. Update Vercel env: NEXT_PUBLIC_API_URL=https://xxxxx.proxy.runpod.io

Option 2: Use Cloudflare Tunnel (Alternative)
----------------------------------------------
Run a simple tunnel from your RunPod pod:
```bash
# In RunPod terminal
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
apt-get install ./cloudflared.deb
cloudflared tunnel --url http://localhost:8000
# Copy the https://xxxxx.trycloudflare.com URL
# Update Vercel: NEXT_PUBLIC_API_URL=https://xxxxx.trycloudflare.com
```

Option 3: Check RunPod Public Access
-------------------------------------
Your pod might already have public access. Check:

```bash
# In RunPod terminal
curl http://localhost:8000/health

# Then test from your local machine
curl http://213.181.111.2:8000/health
```

If the second command works, the IP is public and the issue is CORS or firewall.

Immediate Test:
---------------
First, let's check if the backend is actually running and accessible:

```bash
# Test from RunPod itself
curl http://localhost:8000/health

# Test from your local computer
curl http://213.181.111.2:8000/health
```

