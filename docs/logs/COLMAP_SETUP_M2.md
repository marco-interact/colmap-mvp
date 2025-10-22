# 🔧 COLMAP Setup for M2 Mac - Complete Guide

## 🎯 **Current Status**
- ✅ Python 3.13.7 ready
- ✅ Virtual environment active
- ❌ COLMAP not installed
- ❌ Dependencies missing

---

## 📋 **Step 1: Install Dependencies**

### **Install Homebrew Dependencies**
```bash
# Install core build tools
brew install cmake ninja git wget

# Install COLMAP dependencies
brew install boost eigen flann freeimage glog gflags glew sqlite3 qt5 cgal

# Install image processing libraries
brew install opencv

# Install optional performance libraries
brew install openmp
```

### **Verify Installation**
```bash
# Check versions
cmake --version
ninja --version
boost --version
```

---

## 📋 **Step 2: Build COLMAP from Source**

### **Clone and Build COLMAP**
```bash
# Clone COLMAP repository
git clone https://github.com/colmap/colmap.git
cd colmap

# Create build directory
mkdir build && cd build

# Configure with CMake (M2 optimized)
cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_COMPILER=clang++ \
  -DCMAKE_C_COMPILER=clang \
  -DCMAKE_OSX_ARCHITECTURES=arm64 \
  -DCMAKE_OSX_DEPLOYMENT_TARGET=11.0 \
  -DCMAKE_INSTALL_PREFIX=/usr/local

# Build with all cores
make -j$(sysctl -n hw.ncpu)

# Install system-wide
sudo make install
```

### **Alternative: Install via Homebrew (Easier)**
```bash
# Try Homebrew installation first
brew install colmap

# If that fails, use the manual build above
```

---

## 📋 **Step 3: Verify COLMAP Installation**

### **Test COLMAP Commands**
```bash
# Check COLMAP version
colmap --version

# Test feature extraction
colmap feature_extractor --help

# Test feature matching
colmap exhaustive_matcher --help

# Test 3D reconstruction
colmap mapper --help
```

### **Expected Output**
```
COLMAP 3.9.1
```

---

## 📋 **Step 4: Configure for M2 Laptop**

### **Environment Variables**
```bash
# Add to your shell profile (~/.zshrc)
export OMP_NUM_THREADS=8
export OPENBLAS_NUM_THREADS=8
export MKL_NUM_THREADS=8
export CMAKE_PREFIX_PATH="/opt/homebrew"
```

### **Test COLMAP with M2 Optimization**
```bash
# Test with M2-specific settings
colmap feature_extractor \
  --database_path test.db \
  --image_path test_images \
  --SiftExtraction.max_image_size 1200 \
  --SiftExtraction.max_num_features 8192 \
  --SiftExtraction.use_gpu 0
```

---

## 📋 **Step 5: Project Configuration**

### **Update main.py for M2**
The project is already configured with:
- ✅ M2-optimized frame limits (15/25/40)
- ✅ Conservative image sizes (1200px)
- ✅ Efficient feature extraction (8192 features)
- ✅ Laptop-friendly processing

### **Database Setup**
```bash
# Initialize database
source venv-local/bin/activate
python -c "from database import db; print('Database ready')"
```

---

## 📋 **Step 6: Test Complete Pipeline**

### **Test Backend**
```bash
# Start backend
source venv-local/bin/activate
python main.py
```

### **Test Frontend**
```bash
# Start frontend
npm run dev
```

### **Test Upload**
```bash
# Test video upload
curl -X POST http://localhost:8080/upload-video \
  -F "video=@test-video.mp4" \
  -F "project_id=test" \
  -F "scan_name=test" \
  -F "quality=low" \
  -F "user_email=test@local.com"
```

---

## 🚨 **Troubleshooting**

### **If COLMAP Build Fails**
```bash
# Clean and retry
cd colmap
rm -rf build
mkdir build && cd build

# Use different CMake configuration
cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_PREFIX_PATH="/opt/homebrew"
make -j$(sysctl -n hw.ncpu)
sudo make install
```

### **If Dependencies Missing**
```bash
# Install missing dependencies
brew install --build-from-source cmake
brew install --build-from-source boost
brew install --build-from-source eigen
```

### **If Permission Issues**
```bash
# Fix permissions
sudo chown -R $(whoami) /usr/local
sudo chmod -R 755 /usr/local
```

---

## ✅ **Verification Checklist**

- [ ] COLMAP installed (`colmap --version`)
- [ ] Dependencies installed (boost, eigen, etc.)
- [ ] Python environment ready
- [ ] Database initialized
- [ ] Backend running (http://localhost:8080)
- [ ] Frontend running (http://localhost:3000)
- [ ] Upload endpoint working
- [ ] Processing pipeline functional

---

## 🎯 **Expected Performance (M2 Laptop)**

| Quality | Frames | Time | RAM | Result |
|---------|--------|------|-----|--------|
| **Low** | 15 | 2-3 min | 4-6GB | Good |
| **Medium** | 25 | 5-8 min | 6-8GB | Excellent |
| **High** | 40 | 10-15 min | 8-10GB | Outstanding |

---

## 🚀 **Ready to Process!**

Once COLMAP is installed, your M2 Mac will be ready for:
- ✅ Professional 3D reconstruction
- ✅ Efficient laptop processing
- ✅ High-quality results
- ✅ Fast processing times

**Follow the steps above to complete the setup!**


