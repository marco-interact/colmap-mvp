# Use pre-built image from GitHub Container Registry
# This avoids Northflank build I/O errors by pulling the already-built image

FROM ghcr.io/marco-interact/colmap-mvp@sha256:ef92def84a997ef34a5b23b99f427a05759f21277da8a99765d9b3cf79cfde65

# Image already contains:
# - CUDA 12.2.0 runtime
# - Python 3.11 + all dependencies
# - COLMAP (pre-built from apt)
# - Open3D for advanced visualization
# - All application code (main.py, database.py, open3d_utils.py)
# - Demo resources (PLY and GLB files)
# - Startup event that auto-initializes demo data

# The image is ready to run - no additional setup needed