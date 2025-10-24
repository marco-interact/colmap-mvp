"""
Open3D Integration for Advanced 3D Visualization
Provides COLMAP GUI-like features in web interface

Based on:
- https://www.open3d.org/docs/release/python_api/open3d.camera.html
- https://www.open3d.org/docs/release/python_api/open3d.visualization.html
- https://www.open3d.org/docs/release/python_api/open3d.geometry.html
"""

import open3d as o3d
import numpy as np
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
import json

logger = logging.getLogger(__name__)


class Open3DProcessor:
    """Advanced 3D processing and visualization using Open3D"""
    
    def __init__(self):
        """Initialize Open3D processor"""
        self.version = o3d.__version__
        logger.info(f"Open3D version: {self.version}")
    
    def load_point_cloud(self, file_path: str) -> o3d.geometry.PointCloud:
        """Load point cloud from PLY file"""
        try:
            pcd = o3d.io.read_point_cloud(file_path)
            logger.info(f"Loaded point cloud: {len(pcd.points)} points")
            return pcd
        except Exception as e:
            logger.error(f"Error loading point cloud: {e}")
            raise
    
    def get_point_cloud_stats(self, file_path: str) -> Dict[str, Any]:
        """Get comprehensive statistics for a point cloud
        
        Similar to COLMAP GUI point selection statistics
        """
        try:
            pcd = self.load_point_cloud(file_path)
            
            # Basic stats
            points = np.asarray(pcd.points)
            num_points = len(points)
            
            # Bounding box
            bbox = pcd.get_axis_aligned_bounding_box()
            bbox_min = bbox.get_min_bound()
            bbox_max = bbox.get_max_bound()
            bbox_center = bbox.get_center()
            bbox_extent = bbox.get_extent()
            
            # Colors (if available)
            has_colors = pcd.has_colors()
            colors_info = None
            if has_colors:
                colors = np.asarray(pcd.colors)
                colors_info = {
                    "has_colors": True,
                    "mean_color": colors.mean(axis=0).tolist(),
                    "std_color": colors.std(axis=0).tolist()
                }
            
            # Normals (if available)
            has_normals = pcd.has_normals()
            normals_info = None
            if has_normals:
                normals = np.asarray(pcd.normals)
                normals_info = {
                    "has_normals": True,
                    "mean_normal": normals.mean(axis=0).tolist()
                }
            
            # Compute centroid and covariance
            center = pcd.get_center()
            
            # Nearest neighbor distances (sample for performance)
            sample_size = min(1000, num_points)
            if num_points > 0:
                sample_indices = np.random.choice(num_points, sample_size, replace=False)
                sample_points = points[sample_indices]
                pcd_tree = o3d.geometry.KDTreeFlann(pcd)
                distances = []
                for point in sample_points:
                    [k, idx, dist] = pcd_tree.search_knn_vector_3d(point, 2)  # 2 nearest (including self)
                    if len(dist) > 1:
                        distances.append(np.sqrt(dist[1]))  # Distance to nearest neighbor
                
                avg_nn_distance = np.mean(distances) if distances else 0
            else:
                avg_nn_distance = 0
            
            stats = {
                "num_points": num_points,
                "has_colors": has_colors,
                "has_normals": has_normals,
                "bounding_box": {
                    "min": bbox_min.tolist(),
                    "max": bbox_max.tolist(),
                    "center": bbox_center.tolist(),
                    "extent": bbox_extent.tolist()
                },
                "centroid": center.tolist(),
                "avg_nearest_neighbor_distance": float(avg_nn_distance),
                "colors": colors_info,
                "normals": normals_info
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error computing point cloud stats: {e}")
            raise
    
    def select_point_info(self, file_path: str, point_index: int) -> Dict[str, Any]:
        """Get information about a specific point (COLMAP GUI feature)"""
        try:
            pcd = self.load_point_cloud(file_path)
            points = np.asarray(pcd.points)
            
            if point_index >= len(points):
                raise ValueError(f"Point index {point_index} out of range")
            
            point = points[point_index]
            info = {
                "index": point_index,
                "position": point.tolist()
            }
            
            # Add color if available
            if pcd.has_colors():
                colors = np.asarray(pcd.colors)
                info["color"] = colors[point_index].tolist()
            
            # Add normal if available
            if pcd.has_normals():
                normals = np.asarray(pcd.normals)
                info["normal"] = normals[point_index].tolist()
            
            # Find nearest neighbors
            pcd_tree = o3d.geometry.KDTreeFlann(pcd)
            [k, idx, dist] = pcd_tree.search_knn_vector_3d(point, 10)
            info["nearest_neighbors"] = {
                "indices": idx.tolist(),
                "distances": [np.sqrt(d) for d in dist]
            }
            
            return info
            
        except Exception as e:
            logger.error(f"Error selecting point: {e}")
            raise
    
    def apply_colormap(self, file_path: str, colormap: str = "jet") -> str:
        """Apply colormap to point cloud (COLMAP GUI render option)
        
        Colormaps: jet, viridis, plasma, hot, cool, rainbow
        """
        try:
            pcd = self.load_point_cloud(file_path)
            points = np.asarray(pcd.points)
            
            # Use height (Z-coordinate) for colormap
            z_values = points[:, 2]
            z_normalized = (z_values - z_values.min()) / (z_values.max() - z_values.min())
            
            # Apply colormap
            if colormap == "jet":
                colors = self._jet_colormap(z_normalized)
            elif colormap == "viridis":
                colors = self._viridis_colormap(z_normalized)
            elif colormap == "hot":
                colors = self._hot_colormap(z_normalized)
            else:
                colors = self._jet_colormap(z_normalized)
            
            pcd.colors = o3d.utility.Vector3dVector(colors)
            
            # Save to temp file
            output_path = file_path.replace(".ply", f"_colormap_{colormap}.ply")
            o3d.io.write_point_cloud(output_path, pcd)
            
            logger.info(f"Applied colormap {colormap}, saved to {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error applying colormap: {e}")
            raise
    
    def _jet_colormap(self, values: np.ndarray) -> np.ndarray:
        """Jet colormap (blue -> cyan -> green -> yellow -> red)"""
        colors = np.zeros((len(values), 3))
        colors[:, 0] = np.clip(1.5 - 4 * np.abs(values - 0.75), 0, 1)  # Red
        colors[:, 1] = np.clip(1.5 - 4 * np.abs(values - 0.5), 0, 1)   # Green
        colors[:, 2] = np.clip(1.5 - 4 * np.abs(values - 0.25), 0, 1)  # Blue
        return colors
    
    def _viridis_colormap(self, values: np.ndarray) -> np.ndarray:
        """Viridis colormap (perceptually uniform)"""
        # Simplified viridis approximation
        colors = np.zeros((len(values), 3))
        colors[:, 0] = 0.282 + 0.718 * values  # Red
        colors[:, 1] = 0.0 + 0.855 * values    # Green
        colors[:, 2] = 0.545 - 0.545 * values  # Blue
        return np.clip(colors, 0, 1)
    
    def _hot_colormap(self, values: np.ndarray) -> np.ndarray:
        """Hot colormap (black -> red -> yellow -> white)"""
        colors = np.zeros((len(values), 3))
        colors[:, 0] = np.clip(values * 3, 0, 1)          # Red
        colors[:, 1] = np.clip((values - 0.33) * 3, 0, 1) # Green
        colors[:, 2] = np.clip((values - 0.66) * 3, 0, 1) # Blue
        return colors
    
    def downsample_point_cloud(self, file_path: str, voxel_size: float = 0.05) -> str:
        """Downsample point cloud using voxel grid"""
        try:
            pcd = self.load_point_cloud(file_path)
            pcd_down = pcd.voxel_down_sample(voxel_size=voxel_size)
            
            output_path = file_path.replace(".ply", f"_downsampled_{voxel_size}.ply")
            o3d.io.write_point_cloud(output_path, pcd_down)
            
            logger.info(f"Downsampled from {len(pcd.points)} to {len(pcd_down.points)} points")
            return output_path
            
        except Exception as e:
            logger.error(f"Error downsampling: {e}")
            raise
    
    def estimate_normals(self, file_path: str, radius: float = 0.1, max_nn: int = 30) -> str:
        """Estimate normals for point cloud"""
        try:
            pcd = self.load_point_cloud(file_path)
            
            pcd.estimate_normals(
                search_param=o3d.geometry.KDTreeSearchParamHybrid(
                    radius=radius,
                    max_nn=max_nn
                )
            )
            
            output_path = file_path.replace(".ply", "_with_normals.ply")
            o3d.io.write_point_cloud(output_path, pcd)
            
            logger.info(f"Estimated normals, saved to {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error estimating normals: {e}")
            raise
    
    def remove_outliers(self, file_path: str, nb_neighbors: int = 20, std_ratio: float = 2.0) -> str:
        """Remove statistical outliers from point cloud"""
        try:
            pcd = self.load_point_cloud(file_path)
            
            cl, ind = pcd.remove_statistical_outlier(
                nb_neighbors=nb_neighbors,
                std_ratio=std_ratio
            )
            pcd_clean = pcd.select_by_index(ind)
            
            output_path = file_path.replace(".ply", "_cleaned.ply")
            o3d.io.write_point_cloud(output_path, pcd_clean)
            
            removed = len(pcd.points) - len(pcd_clean.points)
            logger.info(f"Removed {removed} outliers ({removed/len(pcd.points)*100:.1f}%)")
            return output_path
            
        except Exception as e:
            logger.error(f"Error removing outliers: {e}")
            raise
    
    def create_mesh(self, file_path: str, method: str = "poisson") -> str:
        """Create mesh from point cloud (Poisson or Ball Pivoting)"""
        try:
            pcd = self.load_point_cloud(file_path)
            
            # Estimate normals if not present
            if not pcd.has_normals():
                pcd.estimate_normals()
            
            if method == "poisson":
                mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(
                    pcd, depth=9
                )
            elif method == "ball_pivoting":
                distances = pcd.compute_nearest_neighbor_distance()
                avg_dist = np.mean(distances)
                radius = 1.5 * avg_dist
                mesh = o3d.geometry.TriangleMesh.create_from_point_cloud_ball_pivoting(
                    pcd,
                    o3d.utility.DoubleVector([radius, radius * 2])
                )
            else:
                raise ValueError(f"Unknown method: {method}")
            
            output_path = file_path.replace(".ply", f"_mesh_{method}.ply")
            o3d.io.write_triangle_mesh(output_path, mesh)
            
            logger.info(f"Created mesh with {len(mesh.triangles)} triangles")
            return output_path
            
        except Exception as e:
            logger.error(f"Error creating mesh: {e}")
            raise
    
    def render_to_image(self, file_path: str, width: int = 1920, height: int = 1080,
                       camera_params: Optional[Dict] = None) -> str:
        """Render point cloud to image (headless rendering)
        
        Similar to COLMAP GUI screenshot feature
        """
        try:
            pcd = self.load_point_cloud(file_path)
            
            # Create visualizer (headless)
            vis = o3d.visualization.Visualizer()
            vis.create_window(visible=False, width=width, height=height)
            vis.add_geometry(pcd)
            
            # Apply camera parameters if provided
            if camera_params:
                ctr = vis.get_view_control()
                if "zoom" in camera_params:
                    ctr.scale(camera_params["zoom"])
                if "front" in camera_params:
                    ctr.set_front(camera_params["front"])
                if "lookat" in camera_params:
                    ctr.set_lookat(camera_params["lookat"])
                if "up" in camera_params:
                    ctr.set_up(camera_params["up"])
            
            # Render
            vis.poll_events()
            vis.update_renderer()
            
            # Save screenshot
            output_path = file_path.replace(".ply", "_screenshot.png")
            vis.capture_screen_image(output_path)
            vis.destroy_window()
            
            logger.info(f"Rendered to image: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error rendering to image: {e}")
            raise
    
    def get_camera_parameters(self) -> Dict[str, Any]:
        """Get default camera parameters for Open3D visualization"""
        return {
            "class_name": "ViewTrajectory",
            "version_major": 1,
            "version_minor": 0,
            "trajectory": [
                {
                    "boundingbox_max": [1.0, 1.0, 1.0],
                    "boundingbox_min": [-1.0, -1.0, -1.0],
                    "field_of_view": 60.0,
                    "front": [0.0, 0.0, -1.0],
                    "lookat": [0.0, 0.0, 0.0],
                    "up": [0.0, -1.0, 0.0],
                    "zoom": 0.7
                }
            ]
        }


# Global instance
open3d_processor = Open3DProcessor()

