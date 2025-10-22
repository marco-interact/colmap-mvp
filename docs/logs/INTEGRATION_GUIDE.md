# 🔄 COLMAP 3D Reconstruction Integration Guide

## Current Status

✅ **Backend**: GPU-enabled, COLMAP installed  
✅ **Frontend**: Deployed and running  
⚠️ **Integration**: Needs connection between frontend and backend  

---

## 🎯 Complete COLMAP Pipeline

Based on [CMU COLMAP Documentation](https://www.cs.cmu.edu/~reconstruction/colmap.html):

### Phase 1: Image Capturing (Video Upload)
```
User uploads video → Backend extracts frames
```

### Phase 2: Feature Extraction & Matching
```
COLMAP detects SIFT features → Matches features between frames
```

### Phase 3: Sparse Reconstruction
```
Structure-from-Motion (SfM) → Camera poses + Sparse point cloud
```

### Phase 4: Dense Reconstruction
```
Multi-View Stereo (MVS) → Dense point cloud (PLY file)
```

### Phase 5: Mesh Generation (Optional)
```
Poisson surface reconstruction → 3D mesh
```

---

## 🔍 Current Issues

### Issue 1: 3D Viewer Shows Demo Cube
**Location**: `src/components/3d/model-viewer.tsx` (line 392-401)
**Problem**: Hardcoded demo cube instead of loading real PLY files
**Solution**: Add PLY loader to Three.js

### Issue 2: Frontend Not Connecting to Backend
**Location**: `src/app/projects/[id]/page.tsx` (line 186)
**Problem**: Upload goes to demo mode, not real API
**Solution**: Update API client to use backend URL

### Issue 3: PLY Files Not Supported
**Problem**: COLMAP outputs PLY format, but viewer expects GLTF
**Solution**: Add PLY loader library

### Issue 4: Results Not Downloaded from Backend
**Problem**: No endpoint to fetch processed models
**Solution**: Use `/results/{job_id}/{filename}` endpoint

---

## 🛠️ Fixes Needed

### Fix 1: Add PLY Loader Support

Add to `package.json`:
```json
"three-stdlib": "^2.28.0"
```

Update `model-viewer.tsx`:
```typescript
import { PLYLoader } from 'three-stdlib'

function PLYModel({ url }: { url: string }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry>()
  
  useEffect(() => {
    const loader = new PLYLoader()
    loader.load(url, (geometry) => {
      geometry.computeVertexNormals()
      setGeometry(geometry)
    })
  }, [url])
  
  return geometry ? (
    <points>
      <bufferGeometry attach="geometry" {...geometry} />
      <pointsMaterial size={0.01} vertexColors />
    </points>
  ) : null
}
```

### Fix 2: Connect Frontend to Backend API

Update `src/lib/api.ts`:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function uploadVideo(
  file: File,
  projectId: string,
  scanName: string,
  quality: string = 'medium'
) {
  const formData = new FormData()
  formData.append('video', file)
  formData.append('project_id', projectId)
  formData.append('scan_name', scanName)
  formData.append('quality', quality)
  formData.append('user_email', localStorage.getItem('user_email') || 'demo@colmap.app')
  
  const response = await fetch(`${API_URL}/upload-video`, {
    method: 'POST',
    body: formData
  })
  
  return response.json()
}
```

### Fix 3: Poll Job Status

```typescript
export async function getJobStatus(jobId: string) {
  const response = await fetch(`${API_URL}/jobs/${jobId}`)
  return response.json()
}

// Poll every 5 seconds
const pollJobStatus = async (jobId: string) => {
  const interval = setInterval(async () => {
    const status = await getJobStatus(jobId)
    
    if (status.status === 'completed') {
      clearInterval(interval)
      // Load 3D model from status.results
      loadModel(status.results.point_cloud_url)
    }
    
    if (status.status === 'failed') {
      clearInterval(interval)
      showError(status.message)
    }
  }, 5000)
}
```

### Fix 4: Load Results from Backend

```typescript
export async function downloadResult(jobId: string, filename: string) {
  const response = await fetch(
    `${API_URL}/results/${jobId}/${filename}`
  )
  return response.blob()
}
```

---

## 🧪 Testing the Full Pipeline

### Test 1: Backend Health
```bash
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/health
```
**Expected**: `"gpu_available": true` ✅

### Test 2: Upload Video
```bash
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/upload-video \
  -F "video=@test-video.mp4" \
  -F "project_id=test-001" \
  -F "scan_name=Test Scan" \
  -F "quality=low" \
  -F "user_email=test@example.com"
```

**Expected Response**:
```json
{
  "job_id": "uuid-here",
  "scan_id": "scan-uuid",
  "status": "pending",
  "message": "Video uploaded successfully"
}
```

### Test 3: Check Job Status
```bash
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/jobs/{JOB_ID}
```

**Expected Progress**:
```json
{
  "status": "processing",
  "progress": 60,
  "current_stage": "Feature Matching",
  "message": "Matching features between images..."
}
```

### Test 4: Download Results
```bash
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/results/{JOB_ID}/point_cloud.ply \
  -o model.ply
```

---

## 📊 Expected Processing Timeline

| Stage | Duration (A100) | Description |
|-------|----------------|-------------|
| **Upload** | Instant | Video upload to backend |
| **Frame Extraction** | 1-2s | Extract key frames from video |
| **Feature Detection** | 30-60s | SIFT feature extraction (GPU) |
| **Feature Matching** | 1-2 min | Match features between frames (GPU) |
| **Sparse Reconstruction** | 1-2 min | SfM camera pose estimation |
| **Dense Reconstruction** | 2-4 min | MVS dense point cloud |
| **Total (Low Quality)** | ~5-7 min | 30 frames |
| **Total (Medium Quality)** | ~8-12 min | 50 frames |

---

## 🎨 Frontend Features to Implement

### 1. Video Upload with Progress
- [x] File selection
- [x] Drag & drop
- [ ] Upload progress bar
- [ ] Connection to backend API
- [ ] Error handling

### 2. Processing Status
- [ ] Real-time job status polling
- [ ] Progress indicators per stage
- [ ] Estimated time remaining
- [ ] Cancel processing option

### 3. 3D Viewer
- [x] Three.js canvas
- [x] Orbit controls
- [x] Wireframe toggle
- [x] Point cloud toggle
- [x] Measurement tool
- [ ] PLY file loading
- [ ] Real model display
- [ ] Texture support

### 4. Model Download
- [ ] Download PLY file
- [ ] Download sparse model
- [ ] Download images
- [ ] Export options

---

## 🚀 Quick Integration Steps

### Step 1: Test Backend Manually
```bash
# Create a test video (or use existing)
# Upload it directly to backend
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/upload-video \
  -F "video=@your-video.mp4" \
  -F "project_id=test-001" \
  -F "scan_name=Manual Test" \
  -F "quality=low" \
  -F "user_email=test@colmap.app"

# Save the job_id from response
```

### Step 2: Monitor Processing
```bash
# Poll status (replace JOB_ID)
watch -n 5 'curl -s https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/jobs/JOB_ID | jq .'
```

### Step 3: Download Results
```bash
# When status === "completed"
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/results/JOB_ID/point_cloud.ply \
  -o test-model.ply

# View in MeshLab or CloudCompare
```

---

## 📝 Next Actions

### Immediate (Manual Testing)
1. ✅ Backend health check
2. ⏳ Upload test video via curl
3. ⏳ Monitor processing
4. ⏳ Download PLY file
5. ⏳ Verify model quality

### Short Term (Frontend Integration)
1. ⏳ Add PLY loader to viewer
2. ⏳ Connect upload to backend API
3. ⏳ Implement status polling
4. ⏳ Display real models

### Medium Term (Full Pipeline)
1. ⏳ Add mesh generation
2. ⏳ Add texture support
3. ⏳ Improve UI/UX
4. ⏳ Add more quality options

---

## 🎯 Success Criteria

✅ **Backend Working**: 
- GPU detected: `true`
- COLMAP version check passes
- API endpoints responsive

✅ **Video Processing**:
- Upload succeeds
- Frame extraction works
- COLMAP pipeline completes
- PLY file generated

✅ **3D Visualization**:
- PLY file loads in viewer
- Point cloud displays
- Controls work (orbit, zoom)
- Measurements accurate

---

## 📞 Troubleshooting

### Backend Issues
- Check logs: Northflank → Service → Logs
- Verify GPU: `/health` endpoint
- Test COLMAP: `docker exec` into container

### Frontend Issues
- Check console: Browser DevTools
- Verify API URL: Environment variables
- Test CORS: Network tab

### Processing Issues
- Use "low" quality first (30 frames)
- Check video format (MP4 recommended)
- Verify video quality (not too dark/blurry)

---

**Your deployment is online! Now let's integrate the full pipeline.** 🚀

Reference: [CMU COLMAP Documentation](https://www.cs.cmu.edu/~reconstruction/colmap.html)

