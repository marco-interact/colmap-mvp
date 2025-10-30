Update Vercel Environment Variable
===================================

Your Cloudflare Tunnel URL:
https://thick-stylish-collaborative-stockings.trycloudflare.com

Tunnel is working! ✅ Test result:
{"status":"healthy","message":"Backend is running","database_path":"/workspace/database.db"}

OPTION 1: Update via Vercel Dashboard (Easiest)
------------------------------------------------
1. Go to: https://vercel.com/dashboard
2. Click on project: interact-hq/colmap-demo
3. Go to: Settings → Environment Variables
4. Find: NEXT_PUBLIC_API_URL
5. Click "Edit" 
6. Change value to: https://thick-stylish-collaborative-stockings.trycloudflare.com
7. Click "Save"
8. Go to: Deployments tab
9. Click "..." on latest deployment → "Redeploy"


OPTION 2: Update via CLI (Alternative)
---------------------------------------
In your local terminal:
```bash
vercel env rm NEXT_PUBLIC_API_URL production
echo "https://thick-stylish-collaborative-stockings.trycloudflare.com" | vercel env add NEXT_PUBLIC_API_URL production
vercel --prod
```

AFTER UPDATING:
---------------
1. Test the frontend: https://colmap-demo-9j7sb4s0r-interact-hq.vercel.app
2. The browser console errors should be gone!
3. You should see your demo project loading

IMPORTANT:
----------
- The tunnel URL will change if you restart the RunPod pod
- Keep the RunPod terminal open to maintain the tunnel
- If the tunnel dies, restart it with the same cloudflared command

