# Minimal open3d_utils.py - just to prevent import errors
class Open3DProcessor:
    def get_point_cloud_stats(self, path): return {"error": "Open3D not available"}
    def select_point_info(self, path, idx): return {"error": "Open3D not available"}
    def apply_colormap(self, path, cmap): return path
    def downsample_point_cloud(self, path, voxel): return path
    def estimate_normals(self, path, radius, max_nn): return path
    def remove_outliers(self, path, nb_neighbors, std_ratio): return path
    def create_mesh(self, path, method): return path
    def render_to_image(self, path, width, height, camera_params): return ""
    def get_camera_parameters(self): return {"front": [0,0,1], "lookat": [0,0,0], "up": [0,1,0], "zoom": 0.8}

open3d_processor = Open3DProcessor()