# Database Management Features Validation

**Reference:** https://colmap.github.io/tutorial.html#database-management

## ✅ Implementation Status: **COMPLETE**

## Overview

COLMAP stores all extracted data in a single SQLite database file. Database management features allow inspection, modification, and optimization of this data for better reconstruction results.

## Database Schema

The COLMAP database (SQLite) contains the following tables:

### 1. **cameras** - Intrinsic Parameters
- `camera_id`: Unique identifier
- `model`: Camera model (PINHOLE, SIMPLE_PINHOLE, etc.)
- `width`, `height`: Image dimensions
- `params`: Camera parameters (focal length, distortion, etc.)

### 2. **images** - Image Metadata
- `image_id`: Unique identifier
- `name`: Image filename
- `camera_id`: Reference to camera
- `prior_qw/qx/qy/qz`: Prior orientation quaternion (optional)
- `prior_tx/ty/tz`: Prior translation (optional)

### 3. **keypoints** - SIFT Features
- `image_id`: Reference to image
- `rows`: Number of keypoints
- `cols`: 4 (x, y, scale, orientation)
- `data`: Binary blob of keypoint data

### 4. **descriptors** - SIFT Descriptors
- `image_id`: Reference to image
- `rows`: Number of descriptors
- `cols`: 128 (SIFT descriptor dimension)
- `data`: Binary blob of descriptor data

### 5. **matches** - Feature Correspondences
- `pair_id`: Image pair identifier
- `rows`: Number of matches
- `cols`: 2 (match indices)
- `data`: Binary blob of match data

### 6. **two_view_geometries** - Geometrically Verified Matches
- `pair_id`: Image pair identifier
- `config`: Verification configuration
- `F`: Fundamental matrix (9 values)
- `E`: Essential matrix (9 values)
- `H`: Homography matrix (9 values)
- `qvec`: Relative rotation quaternion (4 values)
- `tvec`: Relative translation (3 values)

## Implemented Features

### 1. **Database Inspection** ✅

**Purpose:** Review cameras, images, and feature matches

**Implementation:** `COLMAPProcessor.inspect_database()`

**Returns:**
```json
{
    "status": "success",
    "database_path": "/path/to/database.db",
    "num_cameras": 1,
    "num_images": 30,
    "num_keypoints": 983040,
    "num_matches": 435,
    "num_two_view_geometries": 435,
    "avg_keypoints_per_image": 32768.0,
    "avg_matches_per_pair": 2259.2,
    "avg_inliers_per_pair": 124.5,
    "verification_rate": 100.0,
    "avg_inlier_ratio": 5.5,
    "cameras": [
        {
            "camera_id": 1,
            "model": "PINHOLE",
            "width": 1920,
            "height": 1080,
            "params": "..."
        }
    ],
    "images": [
        {
            "name": "frame_0001.jpg",
            "camera_id": 1,
            "prior_quaternion": [1, 0, 0, 0],
            "prior_translation": [0, 0, 0]
        }
    ]
}
```

**Use Cases:**
- Debugging reconstruction failures
- Analyzing feature quality
- Monitoring processing progress
- Quality assurance

**Code:**
```python
processor = COLMAPProcessor(job_path="/path/to/job")
stats = processor.inspect_database()
print(f"Found {stats['num_images']} images with {stats['num_keypoints']} features")
```

---

### 2. **Database Cleaning** ✅

**Purpose:** Remove unused/invalid data to optimize database

**Implementation:** `COLMAPProcessor.clean_database()`

**Removes:**
- Images without features
- Matches for deleted image pairs
- Orphaned keypoints/descriptors
- Inconsistent records

**Benefits:**
- Smaller file size
- Faster processing
- Cleaner data structure
- Better reconstruction quality

**COLMAP Command:**
```bash
colmap database_cleaner \
  --database_path database.db
```

**Output:**
```json
{
    "status": "success",
    "message": "Database cleaned successfully",
    "backup_path": "/path/to/database.db.backup"
}
```

**Features:**
- Automatic backup creation
- Safe rollback on error
- Logging of operations

**Code:**
```python
processor = COLMAPProcessor(job_path="/path/to/job")
result = processor.clean_database()
# Backup created automatically
```

---

### 3. **Camera Parameter Management** ✅

COLMAP allows sharing intrinsic camera parameters between images from the same camera.

#### Get Camera for Image

**Purpose:** Retrieve camera parameters for a specific image

**Implementation:** `COLMAPProcessor.get_camera_for_image(image_name)`

**Returns:**
```json
{
    "camera_id": 1,
    "model": "PINHOLE",
    "width": 1920,
    "height": 1080,
    "params": "1360.0 1360.0 960.0 540.0"
}
```

**Use Cases:**
- Debugging camera calibration
- Validating intrinsic parameters
- Manual inspection

**Code:**
```python
camera = processor.get_camera_for_image("frame_0001.jpg")
print(f"Camera model: {camera['model']}")
```

#### Set Camera for Multiple Images

**Purpose:** Share camera parameters between images

**Implementation:** `COLMAPProcessor.set_camera_for_images(image_names, camera_id)`

**Use Cases:**
- Sharing intrinsics for images from same camera
- Manual camera calibration
- Correcting camera assignments

**COLMAP GUI Equivalent:** `Set camera` option in database management tool

**Code:**
```python
# Group images from same camera
image_names = ["frame_0001.jpg", "frame_0002.jpg", "frame_0003.jpg"]
result = processor.set_camera_for_images(image_names, camera_id=1)
print(f"Updated {result['updated_images']} images")
```

---

## COLMAP Tutorial Workflow

### Standard Database Management

According to the COLMAP tutorial:

1. **Inspect Database**
   - View imported images and cameras
   - Show features and matches per image
   - Check overlapping images

2. **Modify Entries**
   - Double-click cells to edit
   - Update camera parameters
   - Adjust image metadata

3. **Share Camera Parameters**
   - Select multiple images
   - Choose `Set camera`
   - Set `camera_id` to shared camera

4. **Prior Focal Length**
   - Set `prior_focal_length` flag to 0 or 1
   - 1 = trust focal length (lab calibration)
   - Recommended: `1.25 * max(width, height)` without prior knowledge

### SQLite Direct Access

For advanced users, the database can be accessed directly:

```python
import sqlite3

conn = sqlite3.connect("database.db")
cursor = conn.cursor()

# Query cameras
cursor.execute("SELECT * FROM cameras")
cameras = cursor.fetchall()

# Query images
cursor.execute("SELECT name, camera_id FROM images")
images = cursor.fetchall()

# Query feature statistics
cursor.execute("SELECT AVG(rows) FROM keypoints")
avg_keypoints = cursor.fetchone()[0]

conn.close()
```

---

## API Integration

### Database Inspection Endpoint

**Endpoint:** `GET /api/reconstruction/{job_id}/database/inspect`

**Response:**
```json
{
    "status": "success",
    "num_images": 30,
    "num_keypoints": 983040,
    ...
}
```

### Database Cleaning Endpoint

**Endpoint:** `POST /api/reconstruction/{job_id}/database/clean`

**Response:**
```json
{
    "status": "success",
    "message": "Database cleaned successfully",
    "backup_path": "/path/to/database.db.backup"
}
```

---

## Best Practices

### Database Inspection

1. **After Feature Extraction**
   ```python
   processor.extract_features()
   stats = processor.inspect_database()
   assert stats['num_keypoints'] > 0, "No features extracted"
   ```

2. **After Matching**
   ```python
   processor.match_features()
   stats = processor.inspect_database()
   assert stats['verification_rate'] > 50, "Poor matching quality"
   ```

3. **Quality Monitoring**
   ```python
   stats = processor.inspect_database()
   if stats['avg_keypoints_per_image'] < 1000:
       logger.warning("Low feature density")
   ```

### Database Cleaning

1. **Before Starting New Reconstruction**
   ```python
   processor.clean_database()
   # Start fresh reconstruction
   ```

2. **After Deleting Images**
   ```python
   # Images removed from filesystem
   processor.clean_database()  # Remove orphaned data
   ```

3. **Optimize for Large Datasets**
   ```python
   # Periodic cleaning during long processing
   processor.clean_database()
   ```

### Camera Management

1. **Single Camera Workflow**
   ```python
   # All images share same camera
   image_names = processor.get_all_image_names()
   processor.set_camera_for_images(image_names, camera_id=1)
   ```

2. **Multiple Camera Workflow**
   ```python
   # Group by camera
   camera1_images = [...]
   camera2_images = [...]
   processor.set_camera_for_images(camera1_images, camera_id=1)
   processor.set_camera_for_images(camera2_images, camera_id=2)
   ```

---

## Troubleshooting

### Common Issues

1. **No Features Extracted**
   - Check `num_keypoints` in database
   - Verify images are readable
   - Check feature extraction parameters

2. **No Matches Found**
   - Check `num_matches` in database
   - Verify image overlap
   - Try different matching strategy

3. **Low Verification Rate**
   - Check `verification_rate` < 50%
   - Poor feature quality
   - Insufficient image overlap

4. **Orphaned Data**
   - Run `clean_database()`
   - Remove unused records
   - Reduce file size

---

## Validation Checklist

- ✅ Database inspection with comprehensive statistics
- ✅ Camera parameter management
- ✅ Image metadata access
- ✅ Feature statistics (keypoints, descriptors)
- ✅ Match statistics (matches, two-view geometries)
- ✅ Geometric verification metrics
- ✅ Database cleaning with backup
- ✅ SQLite direct access support
- ✅ API endpoints for web integration
- ✅ Error handling and logging

---

## References

- [COLMAP Database Management Tutorial](https://colmap.github.io/tutorial.html#database-management)
- [Database Format Documentation](https://colmap.github.io/database.html)
- [Command-line Interface](https://colmap.github.io/cli.html#database-cleaner)

