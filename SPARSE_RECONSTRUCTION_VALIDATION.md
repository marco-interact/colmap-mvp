# Sparse Reconstruction - Validated

**Reference:** [COLMAP Tutorial - Sparse Reconstruction](https://colmap.github.io/tutorial.html#sparse-reconstruction)

## ✅ Validation Summary

Incremental Structure-from-Motion (SfM) reconstruction has been validated against the official COLMAP tutorial with comprehensive mapper parameters for optimal reconstruction quality.

---

## 📋 Implementation

### Incremental SfM Process

Per COLMAP tutorial, the reconstruction proceeds as follows:

1. **Load Data:** Extracts features and matches from database into memory
2. **Seed:** Begins reconstruction from an initial image pair
3. **Extend:** Incrementally registers new images and triangulates 3D points
4. **Visualize:** Results shown in real-time (GUI only)
5. **Multiple Models:** Creates separate models if images don't register together

---

## ⚙️ Mapper Parameters

### Initialization

```python
{
    "init_min_num_inliers": 50-150,     # Initial pair quality (quality-dependent)
    "init_max_forward_motion": 0.95,    # Maximum forward motion
    "init_min_tri_angle": 16.0,         # Minimum triangulation angle (degrees)
}
```

**Purpose:** Determines which image pair to start reconstruction from.

---

### Bundle Adjustment

**Reference:** [COLMAP Tutorial](https://colmap.github.io/tutorial.html#sparse-reconstruction)

**Parameters:**
```python
{
    # Refinement Options
    "ba_refine_focal_length": 1,      # Refine camera focal length
    "ba_refine_principal_point": 0,   # Keep principal point fixed
    "ba_refine_extra_params": 1,      # Refine lens distortion
    
    # Iteration Limits
    "ba_local_max_num_iterations": 40,    # Local BA iterations
    "ba_global_max_num_iterations": 100,  # Global BA iterations
    "ba_global_max_refinements": 5,       # Global BA refinements
}
```

**Purpose:** Jointly optimizes camera poses and 3D point locations.

**Algorithm:** Levenberg-Marquardt non-linear optimization

---

### Point Filtering

**Purpose:** Removes outlier 3D points

```python
{
    "filter_max_reproj_error": 4.0-8.0,  # Max reprojection error (pixels)
    "filter_min_tri_angle": 1.5,         # Min triangulation angle (degrees)
    "min_num_matches": 10-20,            # Min matches per point
}
```

**Quality-Based:**
- **Low:** `max_reproj_error=8.0`, `min_matches=10` (permissive)
- **Medium:** `max_reproj_error=6.0`, `min_matches=15` (balanced)
- **High:** `max_reproj_error=4.0`, `min_matches=20` (strict)

---

### Triangulation

**Purpose:** Compute 3D points from 2D correspondences

```python
{
    "tri_min_angle": 1.5,                # Minimum triangulation angle
    "tri_ignore_two_view_tracks": 0,     # Include 2-view-only points
    "tri_max_transitivity": 2,           # Max transitivity for tracks
}
```

**Note:** Including 2-view tracks increases point count but may reduce quality.

---

### Multiple Models

**Reference:** [COLMAP Tutorial](https://colmap.github.io/tutorial.html#sparse-reconstruction)

COLMAP creates multiple reconstruction models if not all images register into the same model.

**Configuration:**
```python
{
    "multiple_models": 1,         # Enable multiple models
    "max_num_models": 10,         # Up to 10 models
    "max_model_overlap": 20,      # Max overlap between models
}
```

**Model Directory Structure:**
```
sparse/
├── 0/              # First reconstruction attempt
│   ├── cameras.bin
│   ├── images.bin
│   └── points3D.bin
├── 1/              # Second reconstruction (usually better)
│   └── ...
└── 2/              # Additional models (if needed)
    └── ...
```

**Best Model Selection:** Automatically picks model with most 3D points.

---

## 📊 Output Files

### Binary Format (sparse/N/)

**Reference:** [COLMAP Output Format](https://colmap.github.io/format.html)

#### 1. cameras.bin
- Camera intrinsic parameters
- Format: `camera_id, model, width, height, params[]`
- Contains: Focal length, principal point, distortion

#### 2. images.bin
- Camera poses (extrinsics)
- Format: `image_id, qvec, tvec, camera_id, name, point2D_ids`
- Contains: Rotation (quaternion), translation, image name

#### 3. points3D.bin
- 3D point cloud
- Format: `point_id, xyz, rgb, error, track[]`
- Contains: 3D coordinates, RGB color, reprojection error

---

## 🎯 Quality Configuration

### Low Quality (Fast)
```python
{
    "init_min_num_inliers": 50,
    "min_num_matches": 10,
    "filter_max_reproj_error": 8.0,
    "processing_time": "1-2 minutes"
}
```

### Medium Quality (Balanced)
```python
{
    "init_min_num_inliers": 100,
    "min_num_matches": 15,
    "filter_max_reproj_error": 6.0,
    "processing_time": "2-5 minutes"
}
```

### High Quality (Maximum)
```python
{
    "init_min_num_inliers": 150,
    "min_num_matches": 20,
    "filter_max_reproj_error": 4.0,
    "processing_time": "5-10 minutes"
}
```

---

## 📈 Statistics Tracking

### Reconstruction Statistics

```python
{
    "registered_images": 45,          # Images successfully registered
    "reconstructed_points": 2810,     # 3D points triangulated
    "num_models": 2,                  # Number of reconstruction models
    "best_model_points": 2810,        # Points in best model
    "model_id": "1",                  # Best model ID
    "status": "success"
}
```

---

## 🔧 Troubleshooting

### If Reconstruction Fails:

**Per COLMAP Tutorial:**

1. **Perform Additional Matching:**
   - Use exhaustive matching
   - Enable guided matching
   - Increase overlap in sequential matching

2. **Manually Choose Initial Pair:**
   - Use `Reconstruction > Reconstruction options > Init`
   - Select images with enough matches from different viewpoints

3. **Adjust Parameters:**
   - Lower `init_min_num_inliers` (try 50 instead of 100)
   - Increase `filter_max_reproj_error` (more permissive filtering)
   - Enable `tri_ignore_two_view_tracks` (include 2-view points)

---

## 🎓 Best Practices

Following COLMAP tutorial recommendations:

1. ✅ **High Visual Overlap:** Each object in 3+ images
2. ✅ **Different Viewpoints:** Vary camera positions (don't just rotate)
3. ✅ **Good Texture:** Avoid texture-less surfaces
4. ✅ **Similar Illumination:** Avoid HDR scenes
5. ✅ **Appropriate Frame Count:** More is not always better (consider downsampling)

---

## ✅ Validation Checklist

- [x] Incremental reconstruction implemented
- [x] Bundle adjustment with focal length refinement
- [x] Point filtering with reprojection error
- [x] Triangulation with quality thresholds
- [x] Multiple model support (up to 10 models)
- [x] Best model selection (most points)
- [x] RGB color extraction
- [x] Quality-based parameters (low/medium/high)
- [x] Statistics tracking (images, points, models)
- [x] Binary format output (cameras, images, points3D)

---

## 📚 Reference

**Official Tutorial:** https://colmap.github.io/tutorial.html#sparse-reconstruction

**Key Concepts:**
- Incremental Structure-from-Motion
- Bundle Adjustment
- Camera Pose Estimation
- Multiple Model Reconstruction

---

**Status:** ✅ **FULLY VALIDATED** against COLMAP Tutorial

