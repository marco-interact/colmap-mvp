# ========================================
# NUCLEAR SOLUTION: Build Complete Image
# This builds everything from scratch with all dependencies
# Build: 2025-10-24T10:20:00Z - COMPLETE NUCLEAR REBUILD
# ========================================

FROM nvidia/cuda:12.2.0-runtime-ubuntu22.04

# Set working directory
WORKDIR /app

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install system dependencies (pre-built COLMAP to avoid I/O errors)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3-pip \
    python3-dev \
    python3-opencv \
    ffmpeg \
    sqlite3 \
    colmap \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .
COPY database.py .
COPY open3d_utils_enhanced.py .

# Copy demo resources
COPY demo-resources/ /app/demo-resources/

# Create data directories
RUN mkdir -p /app/data/results /app/data/cache /app/data/uploads

# GPU environment variables for 40GB VRAM optimization
ENV CUDA_VISIBLE_DEVICES=0
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility

# COLMAP GPU optimization for 40GB VRAM
ENV COLMAP_GPU_ENABLED=1
ENV COLMAP_GPU_INDEX=0
ENV COLMAP_MAX_IMAGE_SIZE=4096
ENV COLMAP_MAX_FEATURES=8192
ENV COLMAP_NUM_THREADS=12

# Open3D optimization
ENV OPEN3D_GPU_ENABLED=1
ENV OPEN3D_CUDA_ARCHITECTURES=80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python3 -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Expose port
EXPOSE 8000

# Run application
CMD ["python3", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]