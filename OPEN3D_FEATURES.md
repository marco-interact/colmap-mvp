# Open3D Advanced Visualization Features

Complete implementation of COLMAP GUI-like features using Open3D for web-based 3D visualization.

**References:**
- [Open3D Python API](https://www.open3d.org/docs/release/python_api/open3d.camera.html)
- [Open3D GitHub](https://github.com/isl-org/Open3D.git)
- [COLMAP GUI Documentation](https://colmap.github.io/gui.html)

---

## 📚 Open3D Modules Integrated

### ✅ Implemented

| Module | Purpose | Status |
|--------|---------|--------|
| `open3d.geometry` | Point clouds, meshes, bounding boxes | ✅ |
| `open3d.io` | Read/write PLY, point clouds, meshes | ✅ |
| `open3d.utility` | KDTree, colors, utilities | ✅ |
| `open3d.visualization` | Rendering, camera parameters | ✅ |
| `open3d.pipelines` | Registration, reconstruction | 🔄 Future |
| `open3d.camera` | Camera intrinsics/extrinsics | 🔄 Future |
| `open3d.t` | Tensor-based processing | 🔄 Future |
| `open3d.ml` | Machine learning pipelines | 🔄 Future |

---

## 🎯 COLMAP GUI Features → Web Implementation

### 1. **Point Selection & Statistics** ✅

**COLMAP GUI:**
```
- Double-click point to select
- Shows point position, color
- Shows projection lines to images
- Displays statistics popup
```

**Our Web API:**
```bash
# Get point cloud statistics
GET /api/point-cloud/{scan_id}/stats

Response:
{
  "scan_id": "...",
  "statistics": {
    "num_points": 1045892,
    "has_colors": true,
    "has_normals": false,
    "bounding_box": {
      "min": [-1.5, -2.0, 0.0],
      "max": [3.5, 2.0, 2.5],
      "center": [1.0, 0.0, 1.25],
      "extent": [5.0, 4.0, 2.5]
    },
    "centroid": [1.0, 0.0, 1.25],
    "avg_nearest_neighbor_distance": 0.025,
    "colors": {
      "has_colors": true,
      "mean_color": [0.65, 0.55, 0.45],
      "std_color": [0.15, 0.12, 0.10]
    }
  }
}

# Get specific point information
GET /api/point-cloud/{scan_id}/point/{point_index}

Response:
{
  "scan_id": "...",
  "point_info": {
    "index": 12345,
    "position": [1.23, 0.45, 0.67],
    "color": [0.8, 0.6, 0.4],
    "normal": [0.0, 1.0, 0.0],
    "nearest_neighbors": {
      "indices": [12344, 12346, 12343, ...],
      "distances": [0.015, 0.018, 0.021, ...]
    }
  }
}
```

---

### 2. **Render Options & Colormaps** ✅

**COLMAP GUI:**
```
Render > Render options
- Point size control
- Camera size control
- Projection type (perspective/orthographic)
- Colormap selection
- Clipping planes
```

**Our Web API:**
```bash
# Apply colormap (jet, viridis, hot, plasma)
POST /api/point-cloud/{scan_id}/colormap?colormap=jet

Response:
{
  "scan_id": "...",
  "colormap": "jet",
  "output_file": "/path/to/colormap_jet.ply",
  "download_url": "/reconstruction/.../download/colormap_jet.ply"
}

# Get camera parameters
GET /api/camera/parameters

Response:
{
  "class_name": "ViewTrajectory",
  "trajectory": [{
    "field_of_view": 60.0,
    "front": [0.0, 0.0, -1.0],
    "lookat": [0.0, 0.0, 0.0],
    "up": [0.0, -1.0, 0.0],
    "zoom": 0.7
  }]
}
```

---

### 3. **Screenshot & Export** ✅

**COLMAP GUI:**
```
Extras > Grab image
Extras > Grab movie (screencast with trajectory)
```

**Our Web API:**
```bash
# Render high-res screenshot
POST /api/point-cloud/{scan_id}/render

Body:
{
  "width": 3840,
  "height": 2160,
  "camera_params": {
    "zoom": 1.5,
    "front": [0.0, 0.0, -1.0],
    "lookat": [0.0, 0.0, 0.0],
    "up": [0.0, -1.0, 0.0]
  }
}

Response:
{
  "scan_id": "...",
  "width": 3840,
  "height": 2160,
  "output_file": "/path/to/screenshot.png",
  "download_url": "/reconstruction/.../download/screenshot.png"
}
```

---

### 4. **Point Cloud Processing** ✅

**Additional Features (beyond COLMAP GUI):**

```bash
# Downsample for faster rendering
POST /api/point-cloud/{scan_id}/downsample?voxel_size=0.05

# Estimate normals
POST /api/point-cloud/{scan_id}/estimate-normals?radius=0.1&max_nn=30

# Remove outliers
POST /api/point-cloud/{scan_id}/remove-outliers?nb_neighbors=20&std_ratio=2.0

# Create mesh (Poisson or Ball Pivoting)
POST /api/point-cloud/{scan_id}/create-mesh?method=poisson
```

---

## 📊 Feature Comparison

| Feature | COLMAP Desktop GUI | Our Web Implementation | Status |
|---------|-------------------|------------------------|--------|
| **Model Viewer Controls** |  |  |  |
| Rotate model | Mouse drag | Three.js OrbitControls | ✅ |
| Zoom model | Scroll | Mouse wheel | ✅ |
| Shift model | Right-click drag | Pan controls | ✅ |
| Change point size | CTRL-scroll | Shader control | ✅ |
| Change camera size | ALT-scroll | Configurable | ✅ |
| **Point Selection** |  |  |  |
| Select point | Double-click | API + UI integration | ✅ Backend, 🔄 Frontend |
| Point statistics | Popup window | API endpoint | ✅ |
| Projection lines | Green lines | Can implement | 🔄 |
| Nearest neighbors | Not shown | Included in API | ✅ |
| **Camera Selection** |  |  |  |
| Select camera | Double-click | Can implement | 🔄 |
| Camera statistics | Popup window | Available via COLMAP DB | ✅ |
| Common points | Purple lines | Can implement | 🔄 |
| **Render Options** |  |  |  |
| Colormap selection | Menu | API endpoint | ✅ |
| Projection type | Menu | Camera params | ✅ |
| Point cloud density | Slider | Downsample API | ✅ |
| Clipping planes | SHIFT-scroll | Can implement | 🔄 |
| **Export Features** |  |  |  |
| Screenshot | Grab image | Render API (headless) | ✅ |
| High-res export | Configurable | 4K/8K support | ✅ |
| Screencast/video | Grab movie | Can implement | 🔄 |
| Camera trajectory | Interpolation | Can implement | 🔄 |
| **Processing** |  |  |  |
| Outlier removal | Not in GUI | Statistical outliers | ✅ |
| Downsampling | Not in GUI | Voxel grid | ✅ |
| Normal estimation | Not in GUI | Radius search | ✅ |
| Mesh creation | Not in GUI | Poisson/Ball Pivoting | ✅ |

---

## 🚀 Usage Examples

### Example 1: Get Point Cloud Statistics

```python
import requests

scan_id = "c19da51a-f3a3-4061-8c10-0dc6f0ade51a"  # Dollhouse scan
response = requests.get(
    f"https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/api/point-cloud/{scan_id}/stats"
)
stats = response.json()

print(f"Points: {stats['statistics']['num_points']:,}")
print(f"Bounding box: {stats['statistics']['bounding_box']}")
```

### Example 2: Apply Colormap

```python
# Apply jet colormap to point cloud
response = requests.post(
    f"https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/api/point-cloud/{scan_id}/colormap",
    params={"colormap": "viridis"}
)
result = response.json()

# Download the colorized point cloud
download_url = result['download_url']
```

### Example 3: Create High-Resolution Screenshot

```python
# Render 4K screenshot
response = requests.post(
    f"https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/api/point-cloud/{scan_id}/render",
    json={
        "width": 3840,
        "height": 2160,
        "camera_params": {
            "zoom": 1.5,
            "front": [0.0, 0.0, -1.0],
            "lookat": [0.0, 0.0, 0.0],
            "up": [0.0, -1.0, 0.0]
        }
    }
)
result = response.json()
print(f"Screenshot saved: {result['download_url']}")
```

### Example 4: Select Specific Point

```python
# Get information about point #1000
response = requests.get(
    f"https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/api/point-cloud/{scan_id}/point/1000"
)
point_info = response.json()

print(f"Position: {point_info['point_info']['position']}")
print(f"Color: {point_info['point_info']['color']}")
print(f"Nearest neighbors: {len(point_info['point_info']['nearest_neighbors']['indices'])}")
```

---

## 🔧 Frontend Integration (TODO)

To integrate these features into the web viewer:

### 1. **Point Selection UI**

```typescript
// src/components/3d/advanced-viewer.tsx

interface PointInfo {
  index: number;
  position: [number, number, number];
  color?: [number, number, number];
  normal?: [number, number, number];
  nearest_neighbors?: {
    indices: number[];
    distances: number[];
  };
}

const handlePointClick = async (pointIndex: number) => {
  const response = await fetch(
    `/api/point-cloud/${scanId}/point/${pointIndex}`
  );
  const data = await response.json();
  setSelectedPoint(data.point_info);
  showPointInfoPopup(data.point_info);
};
```

### 2. **Colormap Selector**

```typescript
// src/components/3d/render-options.tsx

const ColormapSelector = () => {
  const [colormap, setColormap] = useState('jet');
  
  const applyColormap = async () => {
    const response = await fetch(
      `/api/point-cloud/${scanId}/colormap?colormap=${colormap}`,
      { method: 'POST' }
    );
    const data = await response.json();
    // Reload viewer with new colorized point cloud
    loadPointCloud(data.download_url);
  };
  
  return (
    <select value={colormap} onChange={(e) => setColormap(e.target.value)}>
      <option value="jet">Jet</option>
      <option value="viridis">Viridis</option>
      <option value="hot">Hot</option>
      <option value="plasma">Plasma</option>
    </select>
  );
};
```

### 3. **Screenshot Button**

```typescript
// src/components/3d/export-controls.tsx

const ExportScreenshot = () => {
  const exportHighRes = async () => {
    const response = await fetch(
      `/api/point-cloud/${scanId}/render`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          width: 3840,
          height: 2160,
          camera_params: getCurrentCameraParams()
        })
      }
    );
    const data = await response.json();
    window.open(data.download_url, '_blank');
  };
  
  return (
    <button onClick={exportHighRes}>
      Export 4K Screenshot
    </button>
  );
};
```

---

## 📦 Dependencies

**Added to requirements.txt:**
```
open3d==0.18.0  # Advanced 3D visualization and processing
```

**Includes:**
- Point cloud processing (I/O, statistics, transformations)
- Mesh generation (Poisson, Ball Pivoting)
- Visualization (headless rendering, camera control)
- Geometry utilities (KDTree, normals, outliers)
- Colormap generation

---

## 🎨 Available Colormaps

| Colormap | Description | Best For |
|----------|-------------|----------|
| **jet** | Blue → Cyan → Green → Yellow → Red | General purpose, high contrast |
| **viridis** | Purple → Blue → Green → Yellow | Perceptually uniform, scientific |
| **hot** | Black → Red → Yellow → White | Thermal/heat maps |
| **plasma** | Purple → Pink → Orange → Yellow | High dynamic range |
| **cool** | Cyan → Magenta | Temperature data |
| **rainbow** | Full spectrum | Elevation/height data |

---

## 🚀 Performance Considerations

### Headless Rendering
- Uses Open3D's offscreen renderer
- No GPU required for rendering (CPU-based)
- Can run in Docker containers without display

### Point Cloud Size Limits
- **< 1M points**: Real-time operations
- **1-10M points**: 1-5 seconds processing
- **> 10M points**: Consider downsampling first

### Recommendations
1. **Use downsampling** for interactive viewing (voxel_size=0.05)
2. **Estimate normals** for better mesh generation
3. **Remove outliers** before meshing
4. **Cache processed results** for faster subsequent access

---

## 📚 Additional Resources

- [Open3D Documentation](https://www.open3d.org/docs/release/)
- [Open3D Tutorial](https://www.open3d.org/docs/release/tutorial/index.html)
- [COLMAP GUI Documentation](https://colmap.github.io/gui.html)
- [Three.js Documentation](https://threejs.org/docs/)

---

## ✅ Summary

**Implemented:**
- ✅ Point cloud statistics
- ✅ Point selection API
- ✅ Colormap application
- ✅ High-res screenshot rendering
- ✅ Downsampling
- ✅ Normal estimation
- ✅ Outlier removal
- ✅ Mesh generation
- ✅ Camera parameters

**TODO for Full COLMAP GUI Parity:**
- 🔄 Frontend UI for point selection
- 🔄 Projection line visualization
- 🔄 Camera selection UI
- 🔄 Video screencast generation
- 🔄 Camera trajectory interpolation
- 🔄 Interactive clipping planes

**System Status: Backend ✅ Complete | Frontend 🔄 Integration Needed**

