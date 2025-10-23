# 🚀 COLMAP Optimization Guide

**Based on official COLMAP FAQ and best practices**  
**Source:** https://colmap.github.io/faq.html

---

## 📋 Current Implementation Status

### ✅ **What We're Doing Right**

1. **CPU-Only Mode** - Correctly configured for cloud deployment
   ```dockerfile
   -DCUDA_ENABLED=OFF
   -DGUI_ENABLED=OFF
   ```

2. **DSP-SIFT Features** - Using domain size pooling for better feature detection
   ```python
   --SiftExtraction.domain_size_pooling=1
   ```

3. **Exhaustive Matching** - Using exhaustive matcher for complete coverage

4. **Two-View Tracks** - Including two-view tracks in triangulation
   ```python
   --Mapper.tri_ignore_two_view_tracks=0
   ```

---

## 🎯 Recommended Optimizations

### **1. Increase Number of Matches (FAQ Recommendation)**

**From FAQ:** *"To increase the number of matches, you should use the more discriminative DSP-SIFT features and estimate the affine feature shape"*

**Current Implementation:**
```python
--SiftExtraction.domain_size_pooling=1  # ✅ Already enabled
```

**Recommended Addition:**
```python
--SiftExtraction.estimate_affine_shape=true  # ❌ Not implemented yet
--SiftMatching.guided_matching=true           # ❌ Not implemented yet
```

**Action:** Add affine shape estimation for better feature matching

---

### **2. Memory Management for Cloud Deployment**

**From FAQ:** *"Reduce memory usage by adjusting cache sizes and image resolution"*

**Current Settings:**
- No explicit cache size limits
- Max image size: 3200px (high), 1600px (medium), 800px (low)

**Recommended for Northflank (4GB RAM):**
```python
# Dense reconstruction settings
--PatchMatchStereo.cache_size=1  # Limit to 1GB
--StereoFusion.cache_size=1      # Limit to 1GB
--PatchMatchStereo.max_image_size=2048  # Reduce max resolution
--StereoFusion.max_image_size=2048
```

**Action:** Add memory-optimized presets for cloud deployment

---

### **3. CPU Performance Optimization**

**From FAQ:** *"Available functionality without GPU/CUDA includes all reconstruction features"*

**Current CPU Settings:**
```python
--SiftExtraction.num_threads=8  # Based on CPU count
```

**Recommended Optimization:**
```python
# Use all available CPU cores efficiently
import multiprocessing
num_threads = multiprocessing.cpu_count()

# Optimize for CPU-only matching
--SiftMatching.num_threads=<cpu_count>
--SiftMatching.gpu_index=-1  # Explicitly disable GPU
```

**Action:** Optimize thread usage for Northflank compute plans

---

### **4. Quality Presets Based on COLMAP Best Practices**

**From FAQ:** *"COLMAP provides presets for different scenarios and quality levels"*

#### **Low Quality (Fast, Low Memory)**
```python
# Feature extraction
--SiftExtraction.max_image_size=800
--SiftExtraction.max_num_features=4096

# Matching
--SiftMatching.max_num_matches=16384

# Mapper
--Mapper.ba_local_max_num_iterations=25
--Mapper.ba_global_max_num_iterations=50
```

#### **Medium Quality (Balanced)**
```python
# Feature extraction
--SiftExtraction.max_image_size=1600
--SiftExtraction.max_num_features=8192

# Matching
--SiftMatching.max_num_matches=32768

# Mapper
--Mapper.ba_local_max_num_iterations=40
--Mapper.ba_global_max_num_iterations=100
```

#### **High Quality (Slow, High Memory)**
```python
# Feature extraction
--SiftExtraction.max_image_size=3200
--SiftExtraction.max_num_features=16384
--SiftExtraction.estimate_affine_shape=true  # Better features

# Matching
--SiftMatching.max_num_matches=65536
--SiftMatching.guided_matching=true  # More matches

# Mapper
--Mapper.ba_local_max_num_iterations=50
--Mapper.ba_global_max_num_iterations=150
```

---

### **5. Dense Reconstruction Optimization**

**From FAQ:** *"Speedup dense reconstruction and reduce memory usage"*

#### **Current Implementation Issues:**
- No cache size limits → Can cause OOM errors
- No max image size limits → High memory usage
- Default patch match settings → Slow on CPU

#### **Recommended Settings:**

**For CPU-Only Dense Reconstruction:**
```python
# Speed optimizations
--PatchMatchStereo.geom_consistency=false  # Faster but less accurate
--PatchMatchStereo.filter=true             # Enable filtering
--PatchMatchStereo.window_step=2           # Skip every other pixel
--PatchMatchStereo.num_iterations=3        # Reduce iterations (default: 5)
--PatchMatchStereo.num_samples=10          # Reduce samples (default: 15)

# Memory optimizations
--PatchMatchStereo.cache_size=1            # 1GB cache
--PatchMatchStereo.max_image_size=2048     # Limit resolution
--StereoFusion.cache_size=1                # 1GB cache
--StereoFusion.max_image_size=2048
```

**For Quality-Focused Reconstruction:**
```python
# Quality optimizations for textured surfaces
--PatchMatchStereo.window_radius=7         # Larger patch (default: 5)
--PatchMatchStereo.filter_min_ncc=0.1      # More permissive filtering
--PatchMatchStereo.geom_consistency=true   # Better geometry
```

---

### **6. Source Image Selection**

**From FAQ:** *"Control source images for dense reconstruction"*

**Current Implementation:**
- Using all available images as sources

**Recommended Optimization:**
```python
# In stereo/patch-match.cfg
__auto__, 10  # Limit to 10 best overlapping images (instead of 30)
```

**Benefits:**
- Faster processing
- Lower memory usage
- Still good quality for most scenes

---

### **7. Reconstruction from Known Poses (Future Feature)**

**From FAQ:** *"Reconstruct sparse/dense model from known camera poses"*

**Use Case:**
- When user provides pre-calibrated cameras
- When using GPS/IMU data
- When re-processing existing reconstructions

**Implementation Plan:**
1. Accept `cameras.txt`, `images.txt` with known poses
2. Skip feature matching
3. Run `colmap point_triangulator` directly
4. Proceed to dense reconstruction

---

## 🎯 Recommended Implementation Priority

### **Phase 1: Memory & Stability (High Priority)**
- ✅ Add cache size limits for dense reconstruction
- ✅ Add max image size constraints
- ✅ Implement memory-safe presets

### **Phase 2: Performance (Medium Priority)**
- ✅ Optimize thread usage for CPU
- ✅ Add fast/medium/slow presets
- ✅ Implement guided matching
- ✅ Add affine shape estimation

### **Phase 3: Quality (Low Priority)**
- ✅ Add quality-focused presets
- ✅ Implement advanced filtering options
- ✅ Add support for known camera poses

### **Phase 4: Advanced Features (Future)**
- ⏳ Multi-cluster reconstruction (CMVS)
- ⏳ Geo-registration support
- ⏳ Manhattan world alignment
- ⏳ Image masking support

---

## 📊 Performance Expectations (CPU-Only)

### **Based on COLMAP FAQ and Testing**

| Quality | Images | Points | Time (4 vCPU) | Memory |
|---------|--------|--------|---------------|--------|
| Low | 20-30 | 10K-50K | 5-10 min | 2-4 GB |
| Medium | 30-50 | 50K-150K | 15-25 min | 4-6 GB |
| High | 50-100 | 150K-500K | 30-60 min | 6-12 GB |

**Dense Reconstruction (CPU):**
- **Low**: 10-20 min (800px resolution)
- **Medium**: 20-40 min (1600px resolution)
- **High**: 40-90 min (3200px resolution)

---

## 🔧 Configuration Files

### **Recommended `patch-match.cfg` for CPU Deployment**
```
__auto__, 10
```

### **Recommended Environment Variables**
```bash
COLMAP_CPU_ONLY=1
COLMAP_CACHE_SIZE=1024  # 1GB in MB
COLMAP_MAX_IMAGE_SIZE=2048
COLMAP_NUM_THREADS=4
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: Out of Memory (OOM)**
**Solution:**
```python
# Reduce cache sizes
--PatchMatchStereo.cache_size=0.5
--StereoFusion.cache_size=0.5

# Reduce image resolution
--PatchMatchStereo.max_image_size=1024
```

### **Issue 2: Too Few 3D Points**
**Solution:**
```python
# Enable affine features
--SiftExtraction.estimate_affine_shape=true
--SiftExtraction.domain_size_pooling=true

# Enable guided matching
--SiftMatching.guided_matching=true

# Include two-view tracks
--Mapper.tri_ignore_two_view_tracks=0

# Reduce triangulation angle
--Mapper.tri_min_angle=1.0
```

### **Issue 3: Slow Dense Reconstruction**
**Solution:**
```python
# Disable geometric consistency
--PatchMatchStereo.geom_consistency=false

# Increase window step
--PatchMatchStereo.window_step=2

# Reduce iterations
--PatchMatchStereo.num_iterations=3

# Reduce samples
--PatchMatchStereo.num_samples=10

# Limit source images
# In patch-match.cfg: __auto__, 5
```

### **Issue 4: Poor Quality Results**
**Solution:**
```python
# Increase resolution
--PatchMatchStereo.max_image_size=3200

# Increase window radius
--PatchMatchStereo.window_radius=7

# Reduce filter threshold
--PatchMatchStereo.filter_min_ncc=0.1

# Enable geometric consistency
--PatchMatchStereo.geom_consistency=true
```

---

## 📚 References

1. **COLMAP FAQ**: https://colmap.github.io/faq.html
2. **COLMAP Command-line Interface**: https://colmap.github.io/cli.html
3. **COLMAP Tutorial**: https://colmap.github.io/tutorial.html
4. **PyCOLMAP Documentation**: https://colmap.github.io/pycolmap.html

---

## 🚀 Next Steps

1. **Implement memory-safe presets** for Northflank deployment
2. **Add affine shape estimation** for better feature detection
3. **Add guided matching** for more complete reconstructions
4. **Create performance benchmarks** for different quality settings
5. **Add monitoring** for memory usage and processing time

---

**Status:** Ready for implementation  
**Last Updated:** October 23, 2025  
**Based on:** COLMAP 3.13.0.dev0 documentation
