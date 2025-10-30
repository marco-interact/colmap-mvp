# COLMAP Optimization Plan

Based on: [COLMAP Tutorial](https://colmap.github.io/tutorial.html)

## Current State

### What We Have:
- ✅ FastAPI backend (main.py)
- ✅ Database schema (database.py)
- ✅ Static file serving (demo-resources)
- ✅ Frontend with 3D viewer
- ✅ RunPod deployment with RTX 4090 GPU
- ✅ Persistent 50GB volume

### What's Missing:
- ❌ COLMAP processing pipeline (feature extraction, matching, reconstruction)
- ❌ Video frame extraction
- ❌ SIFT feature detection
- ❌ Dense reconstruction workflow
- ❌ Integration with COLMAP binary

## Optimization Plan

### Phase 1: Core COLMAP Integration ⚡

**Goal:** Add basic video → 3D reconstruction pipeline

#### 1.1 Add COLMAP Binary to RunPod
```bash
# On RunPod terminal
sudo apt-get update
sudo apt-get install -y colmap
```

#### 1.2 Video Processing Pipeline
Following [COLMAP Data Structure](https://colmap.github.io/tutorial.html#data-structure):

**Directory Structure:**
```
/workspace/{job_id}/
├── images/          # Extracted frames
├── database.db      # COLMAP database
├── sparse/          # Sparse reconstruction
│   └── 0/
│       ├── cameras.bin
│       ├── images.bin
│       └── points3D.bin
├── dense/           # Dense reconstruction
│   └── fused.ply
└── exports/         # Final outputs
    ├── point_cloud.ply
    ├── mesh.ply
    └── thumbnail.jpg
```

**Pipeline Steps:**
1. Extract frames from video → `images/`
2. Feature extraction → `database.db`
3. Feature matching → `database.db`
4. Sparse reconstruction → `sparse/0/`
5. Export point cloud → `.ply`

### Phase 2: Feature Detection & Extraction

**Reference:** [COLMAP Feature Detection](https://colmap.github.io/tutorial.html#feature-detection-and-extraction)

**Implementation:**
```python
def extract_features(job_id: str, quality: str = "medium"):
    """Extract SIFT features from extracted frames"""
    job_path = f"/workspace/{job_id}"
    
    # COLMAP command
    cmd = [
        "colmap", "feature_extractor",
        "--database_path", f"{job_path}/database.db",
        "--image_path", f"{job_path}/images",
        "--SiftExtraction.use_gpu", "1",  # Use RTX 4090
        "--SiftExtraction.domain_size_pooling", "1",
        "--SiftExtraction.estimate_affine_shape", "1",
    ]
    
    # Quality-based parameters
    if quality == "low":
        cmd.extend([
            "--SiftExtraction.max_num_features", "16384",
            "--SiftExtraction.max_image_size", "2048"
        ])
    elif quality == "medium":
        cmd.extend([
            "--SiftExtraction.max_num_features", "32768",
            "--SiftExtraction.max_image_size", "4096"
        ])
    else:  # high
        cmd.extend([
            "--SiftExtraction.max_num_features", "65536",
            "--SiftExtraction.max_image_size", "8192"
        ])
    
    subprocess.run(cmd, check=True)
```

### Phase 3: Feature Matching

**Reference:** [COLMAP Feature Matching](https://colmap.github.io/tutorial.html#feature-matching-and-geometric-verification)

**For videos → use Sequential Matching:**
```python
def match_features(job_id: str, quality: str = "medium"):
    """Match features between frames"""
    job_path = f"/workspace/{job_id}"
    
    cmd = [
        "colmap", "sequential_matcher",
        "--database_path", f"{job_path}/database.db",
        "--SiftMatching.use_gpu", "1",
        "--SequentialMatching.overlap", "10",  # Video sequences
        "--SiftMatching.guided_matching", "1"
    ]
    
    subprocess.run(cmd, check=True)
```

### Phase 4: Sparse Reconstruction

**Reference:** [COLMAP Sparse Reconstruction](https://colmap.github.io/tutorial.html#sparse-reconstruction)

```python
def sparse_reconstruction(job_id: str):
    """Incremental Structure-from-Motion"""
    job_path = f"/workspace/{job_id}"
    
    cmd = [
        "colmap", "mapper",
        "--database_path", f"{job_path}/database.db",
        "--image_path", f"{job_path}/images",
        "--output_path", f"{job_path}/sparse",
        "--Mapper.num_threads", "8",
        "--Mapper.init_min_num_inliers", "100"
    ]
    
    subprocess.run(cmd, check=True)
```

### Phase 5: Importing and Exporting ✅ COMPLETE

**Reference:** [COLMAP Import/Export](https://colmap.github.io/tutorial.html#importing-and-exporting)

**Status:** ✅ Fully implemented in `colmap_processor.py`

**Export Formats Supported:**
- ✅ **PLY:** Point cloud for visualization
- ✅ **TXT:** Human-readable text format (cameras.txt, images.txt, points3D.txt)
- ✅ **BIN:** Binary format for archiving
- ✅ **NVM:** VisualSFM compatibility format

**Import Capabilities:**
- ✅ **TXT Import:** Re-import text format for continuation
- ✅ **BIN Import:** Re-import binary format
- ✅ **Multiple Model Support:** Automatic model numbering

**Implementation:**
```python
# Export point cloud
ply_file = processor.export_model(output_format="PLY")

# Export text format for debugging
text_dir = processor.export_model(output_format="TXT")

# Import existing model
imported_model = processor.import_model(
    import_path=Path("external_model"),
    input_format="TXT"
)
```

**Documentation:** See `IMPORT_EXPORT_VALIDATION.md`

### Phase 6: Dense Reconstruction (Optional)

**Reference:** [COLMAP Dense Reconstruction](https://colmap.github.io/tutorial.html#dense-reconstruction)

**WARNING:** Requires significantly more compute time

```python
def dense_reconstruction(job_id: str):
    """Multi-view stereo dense reconstruction"""
    job_path = f"/workspace/{job_id}"
    
    # Step 1: Undistort images
    subprocess.run([
        "colmap", "image_undistorter",
        "--image_path", f"{job_path}/images",
        "--input_path", f"{job_path}/sparse/0",
        "--output_path", f"{job_path}/dense",
        "--output_type", "COLMAP"
    ])
    
    # Step 2: PatchMatch Stereo (requires GPU)
    subprocess.run([
        "colmap", "patch_match_stereo",
        "--workspace_path", f"{job_path}/dense",
        "--workspace_format", "COLMAP"
    ])
    
    # Step 3: Stereo fusion
    subprocess.run([
        "colmap", "stereo_fusion",
        "--workspace_path", f"{job_path}/dense",
        "--workspace_format", "COLMAP",
        "--output_path", f"{job_path}/dense/fused.ply"
    ])
```

## API Endpoints to Add

```python
# Upload video and start reconstruction
POST /api/reconstruction/upload
Body: {project_id, scan_name, video_file, quality}

# Get reconstruction status
GET /api/reconstruction/{job_id}/status

# Download point cloud
GET /api/reconstruction/{job_id}/point_cloud.ply

# Get reconstruction statistics
GET /api/reconstruction/{job_id}/stats
```

## Performance Optimizations

### For RTX 4090:
1. **GPU-accelerated SIFT:** Use CUDA for feature extraction
2. **Parallel processing:** Multiple reconstruction threads
3. **Memory optimization:** Process frames in batches
4. **Quality vs Speed:** Offer 3 quality tiers

### Recommended Parameters for RTX 4090:

**Fast (30-60s):**
- 15 frames
- 2048 features
- Sequential matching
- Sparse only

**Medium (2-5min):**
- 30 frames
- 4096 features
- Sequential matching
- Sparse + basic dense

**Quality (10-30min):**
- 50+ frames
- 8192 features
- Exhaustive matching
- Full dense pipeline

## Next Steps

1. ✅ Update `requirements.txt` to include COLMAP
2. ✅ Add COLMAP binary installation to RunPod setup
3. ✅ Create video frame extraction utility
4. ✅ Implement feature extraction endpoint
5. ✅ Implement matching endpoint
6. ✅ Implement sparse reconstruction endpoint
7. ✅ Add point cloud export and import capabilities
8. ⏭️ Test with demo video
9. ⏭️ Add dense reconstruction (optional)
10. ⏭️ Integrate with frontend 3D viewer

## Resources

- [COLMAP Tutorial](https://colmap.github.io/tutorial.html)
- [COLMAP CLI Reference](https://colmap.github.io/cli.html)
- [COLMAP Camera Models](https://colmap.github.io/cam.html)
- [COLMAP Database Format](https://colmap.github.io/database.html)

