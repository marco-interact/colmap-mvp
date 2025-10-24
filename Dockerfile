# ========================================
# COLMAP + Open3D + Three.js Integration
# Complete GPU-optimized setup for 40GB VRAM
# Build: 2025-10-24T08:30:00Z
# ========================================

FROM nvidia/cuda:12.2.0-devel-ubuntu22.04

# Set working directory
WORKDIR /app

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV FORCE_REBUILD=20251024_0830

# Install system dependencies in optimized layers
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3-pip \
    python3-dev \
    python3-opencv \
    ffmpeg \
    sqlite3 \
    git \
    cmake \
    build-essential \
    libopencv-dev \
    libeigen3-dev \
    libgflags-dev \
    libgoogle-glog-dev \
    libgtest-dev \
    libceres-dev \
    libsuitesparse-dev \
    libfreeimage-dev \
    libmetis-dev \
    libboost-all-dev \
    libflann-dev \
    libglew-dev \
    libglfw3-dev \
    libglu1-mesa-dev \
    libxmu-dev \
    libxi-dev \
    && rm -rf /var/lib/apt/lists/*

# Build COLMAP from source with GPU optimization
RUN git clone https://github.com/colmap/colmap.git /tmp/colmap && \
    cd /tmp/colmap && \
    git checkout dev && \
    mkdir build && cd build && \
    cmake .. \
        -DCMAKE_BUILD_TYPE=Release \
        -DCUDA_ENABLED=ON \
        -DCUDA_ARCHS="80" \
        -DCMAKE_CUDA_ARCHITECTURES=80 \
        -DGUI_ENABLED=OFF \
        -DOPENGL_ENABLED=ON \
        -DCMAKE_INSTALL_PREFIX=/usr/local && \
    make -j12 && \
    make install && \
    cd / && rm -rf /tmp/colmap

# Install Python dependencies with Open3D
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Install additional Open3D dependencies
RUN pip3 install --no-cache-dir \
    open3d==0.18.0 \
    trimesh \
    pyvista \
    plotly \
    dash \
    dash-bootstrap-components

# Copy application code
COPY main.py .
COPY database.py .
COPY open3d_utils.py .

# Copy demo resources
COPY demo-resources/ /app/demo-resources/

# Create data directories
RUN mkdir -p /app/data/results /app/data/cache /app/data/uploads

# GPU environment variables for 40GB VRAM optimization
ENV CUDA_VISIBLE_DEVICES=0
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility
ENV CUDA_CACHE_MAXSIZE=0
ENV CUDA_CACHE_DISABLE=0

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