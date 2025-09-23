# 🚀 Vercel Deployment Guide

This guide will help you deploy your COLMAP 3D Visualization Platform to Vercel.

## 🎯 Quick Fix for 404 Errors

The 404 error you're seeing is caused by Vercel not knowing how to handle React Router. Here's how to fix it:

### ✅ Files Added to Fix the Issue

1. **`vercel.json`** - Main Vercel configuration
2. **`frontend/vercel.json`** - Frontend-specific configuration  
3. **`frontend/public/_redirects`** - Fallback routing rules

## 🚀 Deployment Steps

### Option 1: Deploy Frontend Only (Recommended for Testing)

1. **Connect Repository to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with your GitHub account
   - Click "New Project"
   - Import `marco-interact/colmap-app`

2. **Configure Project Settings**:
   ```
   Framework Preset: Create React App
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

3. **Environment Variables**:
   ```
   REACT_APP_API_URL = https://your-backend-url.com/api/v1
   REACT_APP_ENVIRONMENT = production
   ```

4. **Deploy**: Click "Deploy"

### Option 2: Deploy Full-Stack (Frontend + Backend)

**Note**: Vercel has limitations for the backend since it requires long-running COLMAP processes.

For full deployment, consider:
- **Frontend**: Vercel
- **Backend**: Railway, Render, or DigitalOcean

## 🔧 Configuration Explained

### `vercel.json` (Root)
```json
{
  "version": 2,
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"  // Redirect all routes to index.html
    }
  ]
}
```

### `frontend/vercel.json`
- Handles static assets caching
- Sets up proper headers
- Configures build settings

### `frontend/public/_redirects`
- Fallback for client-side routing
- Ensures all routes serve `index.html`
- Preserves API routes

## 🐛 Troubleshooting Common Issues

### 1. 404 Error on Page Refresh
**Solution**: The configuration files above should fix this.

### 2. Build Fails
```bash
# Check locally first
cd frontend
npm install
npm run build
```

### 3. Environment Variables Not Working
- Ensure variables start with `REACT_APP_`
- Set them in Vercel dashboard: Settings → Environment Variables

### 4. API Calls Fail
- Update `REACT_APP_API_URL` in Vercel environment variables
- Ensure CORS is configured on your backend

## 🔗 Backend Deployment Options

Since Vercel has limitations for Python/COLMAP backend:

### Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### Render
1. Connect GitHub repository
2. Choose "Web Service"
3. Root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### DigitalOcean App Platform
1. Connect GitHub repository
2. Choose Python app
3. Set build/run commands
4. Configure environment variables

## 🌐 Custom Domain Setup

After deployment:

1. **Vercel Dashboard** → Your Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. SSL is automatic

## 📊 Performance Optimization

### 1. Build Optimization
```json
// package.json
{
  "scripts": {
    "build": "GENERATE_SOURCEMAP=false react-scripts build"
  }
}
```

### 2. Bundle Analysis
```bash
npm install --save-dev webpack-bundle-analyzer
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

### 3. Code Splitting
Already implemented with React.lazy in your components.

## 🔐 Security Headers

The configuration includes security headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`  
- `Referrer-Policy: strict-origin-when-cross-origin`

## 📈 Monitoring

### Vercel Analytics
- Enable in Vercel dashboard
- Track performance and usage

### Error Tracking
Consider adding:
- Sentry for error tracking
- LogRocket for session replay

## 🚀 Deployment Checklist

- [ ] Repository connected to Vercel
- [ ] Build settings configured correctly
- [ ] Environment variables set
- [ ] Custom domain configured (optional)
- [ ] Backend deployed separately
- [ ] API URL updated in frontend
- [ ] CORS configured on backend
- [ ] SSL certificate active
- [ ] Performance monitoring enabled

## 🆘 Common Vercel Errors

### `NOT_FOUND` (404)
- **Cause**: Missing routing configuration
- **Fix**: The `vercel.json` and `_redirects` files we added

### `FUNCTION_INVOCATION_FAILED`
- **Cause**: Build or runtime error
- **Fix**: Check build logs, ensure dependencies are correct

### `DEPLOYMENT_ERROR`
- **Cause**: Configuration issues
- **Fix**: Verify `vercel.json` syntax and build settings

## 📞 Support

If you need help:
1. **Vercel Docs**: https://vercel.com/docs
2. **Community**: https://github.com/vercel/vercel/discussions
3. **Discord**: Vercel Community Discord

---

## 🎉 Quick Test

After deployment, test these URLs:
- `https://your-app.vercel.app/` - Home page
- `https://your-app.vercel.app/login` - Should not 404
- `https://your-app.vercel.app/dashboard` - Should not 404
- `https://your-app.vercel.app/projects` - Should not 404

All routes should work without 404 errors! 🚀
