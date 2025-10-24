import open3d as o3d
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
import logging

logger = logging.getLogger(__name__)

class Open3DProcessor:
    """Basic Open3D processor for 3D point cloud operations"""
    
    def __init__(self):
        self.gpu_available = self._check_gpu_availability()
    
    def _check_gpu_availability(self) -> bool:
        """Check if GPU is available for Open3D operations"""
        try:
            import cupy as cp
            return True
        except ImportError:
            logger.warning("CuPy not available, using CPU-only mode")
            return False
    
    def get_point_cloud_stats(self, point_cloud_path: str) -> Dict[str, Any]:
        """Get comprehensive statistics for a point cloud"""
        try:
            pcd = o3d.io.read_point_cloud(point_cloud_path)
            
            if len(pcd.points) == 0:
                return {"error": "Empty point cloud"}
            
            points = np.asarray(pcd.points)
            
            stats = {
                "point_count": len(points),
                "has_colors": len(pcd.colors) > 0,
                "has_normals": len(pcd.normals) > 0,
                "bounding_box": {
                    "min": points.min(axis=0).tolist(),
                    "max": points.max(axis=0).tolist(),
                    "size": (points.max(axis=0) - points.min(axis=0)).tolist()
                },
                "centroid": points.mean(axis=0).tolist(),
                "std_deviation": points.std(axis=0).tolist(),
                "density": len(points) / np.prod(points.max(axis=0) - points.min(axis=0))
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting point cloud stats: {e}")
            return {"error": str(e)}
    
    def select_point_info(self, point_cloud_path: str, point_index: int) -> Dict[str, Any]:
        """Get information about a specific point"""
        try:
            pcd = o3d.io.read_point_cloud(point_cloud_path)
            points = np.asarray(pcd.points)
            
            if point_index >= len(points):
                return {"error": "Point index out of range"}
            
            point_info = {
                "index": point_index,
                "coordinates": points[point_index].tolist(),
                "has_color": len(pcd.colors) > 0,
                "has_normal": len(pcd.normals) > 0
            }
            
            if len(pcd.colors) > 0:
                colors = np.asarray(pcd.colors)
                point_info["color"] = colors[point_index].tolist()
            
            if len(pcd.normals) > 0:
                normals = np.asarray(pcd.normals)
                point_info["normal"] = normals[point_index].tolist()
            
            return point_info
            
        except Exception as e:
            logger.error(f"Error getting point info: {e}")
            return {"error": str(e)}
    
    def apply_colormap(self, point_cloud_path: str, colormap: str = "jet") -> str:
        """Apply colormap to point cloud"""
        try:
            pcd = o3d.io.read_point_cloud(point_cloud_path)
            
            if len(pcd.points) == 0:
                return point_cloud_path
            
            points = np.asarray(pcd.points)
            z_coords = points[:, 2]
            z_normalized = (z_coords - z_coords.min()) / (z_coords.max() - z_coords.min())
            
            colors = np.zeros((len(z_normalized), 3))
            colors[:, 0] = np.clip(4 * z_normalized - 2, 0, 1)
            colors[:, 1] = np.clip(4 * z_normalized - 1, 0, 1)
            colors[:, 2] = np.clip(4 * z_normalized, 0, 1)
            
            pcd.colors = o3d.utility.Vector3dVector(colors)
            
            output_path = point_cloud_path.replace('.ply', '_colored.ply')
            o3d.io.write_point_cloud(output_path, pcd)
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error applying colormap: {e}")
            return point_cloud_path
    
    def downsample_point_cloud(self, point_cloud_path: str, voxel_size: float = 0.05) -> str:
        """Downsample point cloud using voxel grid"""
        try:
            pcd = o3d.io.read_point_cloud(point_cloud_path)
            
            if len(pcd.points) == 0:
                return point_cloud_path
            
            downsampled = pcd.voxel_down_sample(voxel_size)
            
            output_path = point_cloud_path.replace('.ply', '_downsampled.ply')
            o3d.io.write_point_cloud(output_path, downsampled)
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error downsampling point cloud: {e}")
            return point_cloud_path
    
    def estimate_normals(self, point_cloud_path: str, radius: float = 0.1, max_nn: int = 30) -> str:
        """Estimate normals for point cloud"""
        try:
            pcd = o3d.io.read_point_cloud(point_cloud_path)
            
            if len(pcd.points) == 0:
                return point_cloud_path
            
            pcd.estimate_normals(
                search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=radius, max_nn=max_nn)
            )
            
            output_path = point_cloud_path.replace('.ply', '_normals.ply')
            o3d.io.write_point_cloud(output_path, pcd)
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error estimating normals: {e}")
            return point_cloud_path
    
    def remove_outliers(self, point_cloud_path: str, nb_neighbors: int = 20, std_ratio: float = 2.0) -> str:
        """Remove statistical outliers from point cloud"""
        try:
            pcd = o3d.io.read_point_cloud(point_cloud_path)
            
            if len(pcd.points) == 0:
                return point_cloud_path
            
            cleaned, _ = pcd.remove_statistical_outlier(nb_neighbors=nb_neighbors, std_ratio=std_ratio)
            
            output_path = point_cloud_path.replace('.ply', '_cleaned.ply')
            o3d.io.write_point_cloud(output_path, cleaned)
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error removing outliers: {e}")
            return point_cloud_path
    
    def create_mesh(self, point_cloud_path: str, method: str = "poisson") -> str:
        """Create mesh from point cloud"""
        try:
            pcd = o3d.io.read_point_cloud(point_cloud_path)
            
            if len(pcd.points) == 0:
                return point_cloud_path
            
            if method == "poisson":
                mesh, _ = pcd.create_mesh_poisson(depth=9)
            elif method == "ball_pivoting":
                distances = pcd.compute_nearest_neighbor_distance()
                avg_dist = np.mean(distances)
                radius = 3 * avg_dist
                mesh = pcd.create_mesh_ball_pivoting(radius)
            else:
                return point_cloud_path
            
            output_path = point_cloud_path.replace('.ply', f'_{method}_mesh.ply')
            o3d.io.write_triangle_mesh(output_path, mesh)
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error creating mesh: {e}")
            return point_cloud_path
    
    def render_to_image(self, point_cloud_path: str, width: int = 1920, height: int = 1080, 
                       camera_params: Optional[Dict] = None) -> str:
        """Render point cloud to high-resolution image"""
        try:
            pcd = o3d.io.read_point_cloud(point_cloud_path)
            
            if len(pcd.points) == 0:
                return ""
            
            if camera_params is None:
                camera_params = self.get_camera_parameters()
            
            vis = o3d.visualization.Visualizer()
            vis.create_window(width=width, height=height, visible=False)
            vis.add_geometry(pcd)
            
            ctr = vis.get_view_control()
            ctr.set_front(camera_params["front"])
            ctr.set_lookat(camera_params["lookat"])
            ctr.set_up(camera_params["up"])
            ctr.set_zoom(camera_params["zoom"])
            
            output_path = point_cloud_path.replace('.ply', '_render.png')
            vis.capture_screen_image(output_path)
            vis.destroy_window()
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error rendering to image: {e}")
            return ""
    
    def get_camera_parameters(self) -> Dict[str, Any]:
        """Get default camera parameters for Open3D visualization"""
        return {
            "front": [0.0, 0.0, 1.0],
            "lookat": [0.0, 0.0, 0.0],
            "up": [0.0, 1.0, 0.0],
            "zoom": 0.8
        }

# Global processor instance
open3d_processor = Open3DProcessor()
