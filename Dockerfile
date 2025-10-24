# Use pre-built image from GitHub Container Registry
# This avoids Northflank build I/O errors by pulling the already-built image

FROM ghcr.io/marco-interact/colmap-mvp@sha256:dc54b054c81d1e43f6cb79149571b1a71eaa4fe85498f8f43fd7619f170ef6c6

# Image already contains:
# - CUDA 12.2.0 runtime
# - Python 3.11 + all dependencies
# - COLMAP (pre-built from apt)
# - Open3D for advanced visualization
# - All application code (main.py, database.py, open3d_utils.py)
# - Demo resources (PLY and GLB files)
# - Startup event that auto-initializes demo data

# The image is ready to run - no additional setup needed
