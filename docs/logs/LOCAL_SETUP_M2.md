# 🍎 Local Development Setup - Apple M2 Mac

**Goal**: Run COLMAP MVP locally on Apple M2 with 16GB RAM, enabling all features and storage functionality.

---

## 🎯 **Overview**

This setup will give you:
- ✅ Full COLMAP functionality (CPU-optimized for M2)
- ✅ Local database with all CRUD operations
- ✅ File storage for projects and scans
- ✅ 3D model viewing
- ✅ No cloud costs
- ✅ Fast development cycle

---

## 📋 **Prerequisites**

### **1. Install Homebrew (if not already installed)**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### **2. Install Required Tools**
```bash
# Core dependencies
brew install python@3.11 cmake ninja git wget

# COLMAP dependencies
brew install boost eigen flann freeimage glog gflags glew sqlite3 qt5 cgal

# Image processing
brew install opencv

# Optional: For better performance
brew install openmp
```

### **3. Install COLMAP**
```bash
# Clone and build COLMAP
git clone https://github.com/colmap/colmap.git
cd colmap
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j$(sysctl -n hw.ncpu)
sudo make install
```

### **4. Verify COLMAP Installation**
```bash
colmap --version
# Should show: COLMAP 3.9.1 (or similar)
```

---

## 🚀 **Local Development Setup**

### **1. Backend Setup**

**Create local environment:**
```bash
cd /Users/marco.aurelio/Desktop/colmap-mvp

# Create virtual environment
python3.11 -m venv venv-local
source venv-local/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Install additional local dependencies
pip install uvicorn[standard] python-multipart psutil
```

**Create local config file:**
```bash
# Create local environment file
cat > .env.local << 'EOF'
# Local Development Environment
NODE_ENV=development
PORT=8080
DATABASE_PATH=./data/colmap_app.db
STORAGE_DIR=./data/results
CACHE_DIR=./data/cache
COLMAP_CPU_ONLY=true
MAX_CONCURRENT_JOBS=2
NEXT_PUBLIC_API_URL=http://localhost:8080
EOF
```

### **2. Database Setup**

**Initialize local database:**
```bash
# Create data directories
mkdir -p data/results data/cache

# Initialize database
python3 -c "
from database import db
print('Database initialized:', db.db_path)
print('Tables created successfully')
"
```

### **3. Frontend Setup**

**Install frontend dependencies:**
```bash
# Install Node.js dependencies
npm install

# Install additional 3D libraries
npm install three-stdlib @react-three/fiber @react-three/drei
```

**Update API configuration:**
```typescript
// src/lib/api.ts - Update for local development
const getWorkerUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use localhost
    return 'http://localhost:8080'
  }
  // Server-side: use localhost
  return 'http://localhost:8080'
}
```

---

## 🛠️ **Development Scripts**

### **1. Start Backend**
```bash
# Terminal 1: Backend
cd /Users/marco.aurelio/Desktop/colmap-mvp
source venv-local/bin/activate
python main.py
```

### **2. Start Frontend**
```bash
# Terminal 2: Frontend
cd /Users/marco.aurelio/Desktop/colmap-mvp
npm run dev
```

### **3. Access Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Docs**: http://localhost:8080/docs

---

## 🗄️ **Storage Configuration**

### **1. Local File Storage**
```python
# main.py - Update storage paths for local development
STORAGE_DIR = Path("./data/results")
CACHE_DIR = Path("./data/cache")
DATABASE_PATH = "./data/colmap_app.db"
```

### **2. Project Management**
```python
# Enable full CRUD operations
def create_project(user_id, name, description, location, space_type, project_type):
    # Full project creation with all fields
    pass

def create_scan(project_id, name, video_filename, video_size, quality):
    # Full scan creation with file storage
    pass
```

### **3. File Upload Handling**
```python
# Enhanced upload with local storage
@app.post("/upload-video")
async def upload_video(
    video: UploadFile = File(...),
    project_id: str = Form(...),
    scan_name: str = Form(...),
    quality: str = Form("medium"),
    user_email: str = Form("demo@colmap.app")
):
    # Save to local storage
    local_path = f"./data/uploads/{project_id}/{scan_name}.mp4"
    # Process with COLMAP
    # Save results to local storage
```

---

## 🎨 **Frontend Enhancements**

### **1. Remove Demo Projects**
```typescript
// src/lib/api.ts - Remove demo data
export const localStorage = {
  getProjects: (): Project[] => {
    // Return empty array - no demo projects
    return []
  },
  
  getScans: (): Scan[] => {
    // Return empty array - no demo scans
    return []
  }
}
```

### **2. Enable Full Storage**
```typescript
// Enhanced project creation
export async function createProject(
  userEmail: string, 
  name: string, 
  description: string = '', 
  location: string = '', 
  spaceType: string = '', 
  projectType: string = ''
): Promise<{ projectId: string }> {
  // Full API integration with backend
  const response = await fetch('http://localhost:8080/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_email: userEmail,
      name, description, location,
      space_type: spaceType,
      project_type: projectType
    })
  })
  return response.json()
}
```

### **3. Enhanced 3D Viewer**
```typescript
// src/components/3d/model-viewer.tsx
import { PLYLoader } from 'three-stdlib'
import { useFrame } from '@react-three/fiber'

export function ModelViewer({ modelUrl }: { modelUrl: string }) {
  // Full 3D model loading and interaction
  // Point cloud rendering
  // Camera controls
  // Lighting setup
}
```

---

## ⚡ **M2 Optimizations**

### **1. COLMAP CPU Optimization**
```python
# main.py - M2-specific optimizations
def run_feature_extraction(self) -> bool:
    cmd = [
        "colmap", "feature_extractor",
        "--database_path", str(self.database_path),
        "--image_path", str(self.images_dir),
        "--ImageReader.single_camera", "1",
        "--SiftExtraction.use_gpu", "0",  # CPU only
        "--SiftExtraction.max_image_size", "1200",  # M2 optimized
        "--SiftExtraction.max_num_features", "8192"  # M2 memory optimized
    ]
```

### **2. Memory Management**
```python
# Optimize for 16GB RAM
MAX_CONCURRENT_JOBS = 2  # Allow 2 concurrent jobs
FRAME_LIMITS = {
    "low": 15,    # M2 can handle more frames
    "medium": 30,
    "high": 50
}
```

### **3. Performance Tuning**
```bash
# Set optimal environment variables
export OMP_NUM_THREADS=8  # Use all M2 cores
export OPENBLAS_NUM_THREADS=8
export MKL_NUM_THREADS=8
```

---

## 🧪 **Testing Setup**

### **1. Test Database**
```bash
# Test database operations
python -c "
from database import db
# Create test user
user_id = db.create_user('test@local.com', 'Test User')
print('User created:', user_id)

# Create test project
project_id = db.create_project(user_id, 'Test Project', 'Local test')
print('Project created:', project_id)

# Create test scan
scan_id = db.create_scan(project_id, 'Test Scan', 'test.mp4', 1024, 'low')
print('Scan created:', scan_id)
"
```

### **2. Test COLMAP**
```bash
# Test COLMAP installation
colmap --help
colmap feature_extractor --help
colmap exhaustive_matcher --help
```

### **3. Test Upload**
```bash
# Test video upload
curl -X POST http://localhost:8080/upload-video \
  -F "video=@test-video.mp4;type=video/mp4" \
  -F "project_id=test-project" \
  -F "scan_name=Local Test" \
  -F "quality=low" \
  -F "user_email=test@local.com"
```

---

## 📁 **Project Structure**

```
colmap-mvp/
├── data/                    # Local storage
│   ├── colmap_app.db       # SQLite database
│   ├── results/            # Processed results
│   ├── cache/              # Processing cache
│   └── uploads/            # Uploaded videos
├── venv-local/             # Python virtual environment
├── node_modules/           # Node.js dependencies
├── src/                    # Frontend source
├── main.py                 # Backend server
├── database.py             # Database operations
├── requirements.txt        # Python dependencies
├── package.json           # Node.js dependencies
└── .env.local             # Local environment config
```

---

## 🚀 **Quick Start Commands**

### **1. One-time Setup**
```bash
# Install dependencies
brew install python@3.11 cmake ninja boost eigen flann opencv
pip install -r requirements.txt
npm install

# Build COLMAP
git clone https://github.com/colmap/colmap.git
cd colmap && mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j$(sysctl -n hw.ncpu) && sudo make install
```

### **2. Daily Development**
```bash
# Terminal 1: Backend
source venv-local/bin/activate
python main.py

# Terminal 2: Frontend  
npm run dev

# Access: http://localhost:3000
```

---

## 🎯 **Expected Performance**

### **M2 16GB Capabilities:**
- **Low Quality**: 5-10 minutes processing
- **Medium Quality**: 10-20 minutes processing  
- **High Quality**: 20-40 minutes processing
- **Concurrent Jobs**: 2 simultaneous
- **Memory Usage**: ~8-12GB peak
- **Storage**: Local SSD (fast I/O)

### **Quality Settings:**
- **Low**: 15 frames, 1200px max
- **Medium**: 30 frames, 1600px max
- **High**: 50 frames, 2000px max

---

## 🔧 **Troubleshooting**

### **COLMAP Build Issues:**
```bash
# If COLMAP build fails
brew install --build-from-source cmake
export CMAKE_PREFIX_PATH="/opt/homebrew"
```

### **Python Dependencies:**
```bash
# If pip install fails
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt --no-cache-dir
```

### **Node.js Issues:**
```bash
# If npm install fails
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 **Local vs Cloud Comparison**

| Feature | Cloud (A100) | Local (M2) |
|---------|--------------|------------|
| **Cost** | $2,460/month | $0/month |
| **Speed** | 5-10 min | 10-20 min |
| **Quality** | Identical | Identical |
| **Storage** | Cloud | Local SSD |
| **Privacy** | Cloud | Local |
| **Development** | Slow | Fast |

---

**Ready to start? Follow the setup steps above and you'll have a fully functional local COLMAP system!**

