# ✅ COLMAP MVP - Deployment Checklist

**Reference**: [Official COLMAP Documentation](https://colmap.github.io/)

---

## 🎯 Overview

This checklist guides you through completing the COLMAP MVP deployment, from database activation to full end-to-end testing.

**Current Progress**: 80% Complete  
**Time to Completion**: ~3 hours

---

## ☑️ Phase 1: Database Deployment (10-15 mins)

### 1.1 Rebuild Backend on Northflank
- [ ] Go to https://app.northflank.com
- [ ] Select COLMAP Worker GPU service
- [ ] Click "Deploy" button (top right)
- [ ] Wait for build to complete (~10 mins)
- [ ] Check build logs for success

### 1.2 Verify Database Endpoints
```bash
# Should return "connected"
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/database/status | jq '.status'
```
- [ ] Database status returns "connected"
- [ ] Database exists: true
- [ ] Database path: `/app/data/colmap_app.db`

### 1.3 Initialize Test Data
```bash
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/database/init-test-data | jq
```
- [ ] Test user created: `test@colmap.app`
- [ ] Demo project created
- [ ] Response status: "success"

### 1.4 Run Database Tests
```bash
./test-database.sh
```
- [ ] All critical tests pass
- [ ] Database in persistent volume
- [ ] CRUD operations work

---

## ☑️ Phase 2: Frontend Integration (2 hours)

### 2.1 Install Dependencies
```bash
cd /path/to/colmap-mvp
npm install three-stdlib
```
- [ ] PLY loader installed
- [ ] No dependency errors

### 2.2 Update API Client (`src/lib/api.ts`)

Add the following functions:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function uploadVideo(
  file: File,
  projectId: string,
  scanName: string,
  quality: 'low' | 'medium' | 'high' = 'medium'
) {
  const formData = new FormData()
  formData.append('video', file)
  formData.append('project_id', projectId)
  formData.append('scan_name', scanName)
  formData.append('quality', quality)
  formData.append('user_email', localStorage.getItem('user_email') || 'test@colmap.app')
  
  const response = await fetch(`${API_URL}/upload-video`, {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) throw new Error('Upload failed')
  return response.json()
}

export async function getJobStatus(jobId: string) {
  const response = await fetch(`${API_URL}/jobs/${jobId}`)
  if (!response.ok) throw new Error('Failed to get job status')
  return response.json()
}

export async function downloadResult(jobId: string, filename: string) {
  const response = await fetch(`${API_URL}/results/${jobId}/${filename}`)
  if (!response.ok) throw new Error('Failed to download result')
  return response.blob()
}
```

- [ ] API functions added
- [ ] TypeScript types correct
- [ ] No linting errors

### 2.3 Update Upload Form (`src/app/projects/[id]/page.tsx`)

Replace demo mode with real API calls:

```typescript
const handleUpload = async (formData: FormData) => {
  try {
    const video = formData.get('video') as File
    const scanName = formData.get('scanName') as string
    const quality = formData.get('quality') as 'low' | 'medium' | 'high'
    
    // Upload to backend
    const result = await uploadVideo(video, projectId, scanName, quality)
    
    // Start polling for status
    pollJobStatus(result.job_id)
    
    // Show success message
    toast.success('Upload successful! Processing started...')
  } catch (error) {
    toast.error('Upload failed: ' + error.message)
  }
}

const pollJobStatus = async (jobId: string) => {
  const interval = setInterval(async () => {
    try {
      const status = await getJobStatus(jobId)
      
      // Update progress UI
      setProgress(status.progress)
      setCurrentStage(status.current_stage)
      
      if (status.status === 'completed') {
        clearInterval(interval)
        // Load 3D model
        loadModel(status.results.point_cloud_url)
        toast.success('Processing complete!')
      }
      
      if (status.status === 'failed') {
        clearInterval(interval)
        toast.error('Processing failed: ' + status.message)
      }
    } catch (error) {
      clearInterval(interval)
      toast.error('Status check failed')
    }
  }, 5000) // Poll every 5 seconds
}
```

- [ ] Upload form connected to API
- [ ] Status polling implemented
- [ ] Progress UI updated
- [ ] Error handling works

### 2.4 Update 3D Viewer (`src/components/3d/model-viewer.tsx`)

Add PLY loader:

```typescript
import { PLYLoader } from 'three-stdlib'

function PLYModel({ url }: { url: string }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry>()
  
  useEffect(() => {
    const loader = new PLYLoader()
    loader.load(
      url,
      (geometry) => {
        geometry.computeVertexNormals()
        setGeometry(geometry)
      },
      (progress) => {
        console.log('Loading:', (progress.loaded / progress.total) * 100 + '%')
      },
      (error) => {
        console.error('Error loading PLY:', error)
      }
    )
  }, [url])
  
  if (!geometry) return <Loader />
  
  return (
    <points>
      <bufferGeometry attach="geometry" {...geometry} />
      <pointsMaterial 
        size={0.01} 
        vertexColors 
        sizeAttenuation 
      />
    </points>
  )
}

// In your viewer component:
{modelUrl && <PLYModel url={modelUrl} />}
```

- [ ] PLY loader component created
- [ ] Point cloud renders correctly
- [ ] Controls work (orbit, zoom)
- [ ] No performance issues

### 2.5 Deploy Frontend
```bash
git add -A
git commit -m "🔗 Connect frontend to backend API"
git push origin main
```

Then rebuild on Northflank:
- [ ] Frontend rebuilt on Northflank
- [ ] No build errors
- [ ] Frontend accessible

---

## ☑️ Phase 3: End-to-End Testing (30 mins)

### 3.1 Test Video Upload via Frontend
- [ ] Open frontend in browser
- [ ] Create/select a project
- [ ] Upload a test video (MP4, <100MB)
- [ ] Video upload succeeds
- [ ] Job ID returned

### 3.2 Monitor Processing
- [ ] Progress bar updates
- [ ] Current stage displays correctly
- [ ] Processing stages:
  - [ ] Frame Extraction
  - [ ] Feature Detection
  - [ ] Feature Matching
  - [ ] Sparse Reconstruction
  - [ ] Dense Reconstruction

### 3.3 Verify Results
- [ ] Processing completes successfully
- [ ] 3D model loads in viewer
- [ ] Point cloud displays correctly
- [ ] Controls work (rotate, zoom, pan)

### 3.4 Test via API (Alternative)
```bash
# Upload video
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/upload-video \
  -F "video=@test-video.mp4" \
  -F "project_id=PROJECT_ID" \
  -F "scan_name=Test Scan" \
  -F "quality=low" \
  -F "user_email=test@colmap.app"

# Monitor (replace JOB_ID)
watch -n 5 'curl -s https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/jobs/JOB_ID | jq'

# Download result
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/results/JOB_ID/point_cloud.ply -o model.ply
```

- [ ] API upload works
- [ ] Status updates correctly
- [ ] PLY file downloads
- [ ] File opens in MeshLab/CloudCompare

### 3.5 Database Persistence Test
- [ ] Create a project via frontend
- [ ] Note the project name
- [ ] Restart backend service on Northflank
- [ ] Refresh frontend
- [ ] Project still exists ✅

---

## ☑️ Phase 4: Quality Assurance (15 mins)

### 4.1 Different Quality Levels
Test with "low", "medium", "high":
- [ ] Low quality (30 frames) completes in ~5-7 mins
- [ ] Medium quality (50 frames) completes in ~8-12 mins
- [ ] High quality (100 frames) completes in ~15-25 mins

### 4.2 Error Handling
Test error scenarios:
- [ ] Invalid video format → Error message
- [ ] Video too short → Error message
- [ ] Invalid project ID → Error message
- [ ] Network error → Retry or error message

### 4.3 Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Mobile responsive

---

## ☑️ Phase 5: Documentation Review (10 mins)

- [ ] README.md updated with current status
- [ ] API_REFERENCE.md covers all endpoints
- [ ] DATABASE_SETUP.md explains schema
- [ ] INTEGRATION_GUIDE.md has correct URLs
- [ ] STATUS_SUMMARY.md reflects completion

---

## ☑️ Phase 6: Production Readiness (Optional)

### 6.1 Security
- [ ] Update CORS to specific frontend domain
- [ ] Add rate limiting
- [ ] Add authentication
- [ ] Add API keys

### 6.2 Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Add performance monitoring
- [ ] Configure alerts for failures
- [ ] Set up backup for database

### 6.3 Optimization
- [ ] Enable caching for static assets
- [ ] Optimize PLY file sizes
- [ ] Add CDN for results
- [ ] Implement lazy loading

---

## 🎉 Completion Criteria

### ✅ Minimum Viable Product
- [x] Backend deployed with GPU
- [x] Frontend deployed
- [x] Database implemented
- [ ] Database endpoints live
- [ ] Video upload working
- [ ] 3D reconstruction completes
- [ ] Results display in viewer
- [ ] Data persists across restarts

### ✅ Full Feature Set
- [ ] User authentication
- [ ] Project management
- [ ] Multiple scans per project
- [ ] Quality selection
- [ ] Progress tracking
- [ ] 3D viewer with controls
- [ ] Download results
- [ ] Error handling

---

## 📊 Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Backend uptime | >99% | ✅ |
| Database connectivity | 100% | ⏳ |
| Video upload success | >95% | ⏳ |
| Processing success | >90% | ⏳ |
| 3D model load time | <5s | ⏳ |
| User satisfaction | 4.5/5 | ⏳ |

---

## 🐛 Troubleshooting

### Issue: Database endpoints 404
**Solution**: Rebuild backend on Northflank

### Issue: Frontend can't connect to backend
**Solution**: Check `NEXT_PUBLIC_API_URL` environment variable

### Issue: 3D model doesn't load
**Solutions**:
1. Check PLY file exists in results
2. Verify PLYLoader is installed
3. Check browser console for errors

### Issue: Processing fails
**Solutions**:
1. Check video format (MP4 recommended)
2. Reduce quality to "low"
3. Check backend logs for COLMAP errors
4. Verify GPU is available

---

## 📚 Reference Documentation

- **[Official COLMAP Docs](https://colmap.github.io/)** - COLMAP usage and API
- **[STATUS_SUMMARY.md](STATUS_SUMMARY.md)** - Current status
- **[API_REFERENCE.md](API_REFERENCE.md)** - All endpoints
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Database info

---

## 🚀 Quick Commands

```bash
# Test database
./test-database.sh

# Test deployment
./test-deployment.sh

# Check backend health
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/health | jq

# Check database status
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/database/status | jq

# Initialize test data
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/database/init-test-data | jq
```

---

**Current Step**: Phase 1.1 - Rebuild Backend on Northflank

**Go to**: https://app.northflank.com and click "Deploy" 🚀

Reference: [Official COLMAP Documentation](https://colmap.github.io/)
