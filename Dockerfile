# Dockerfile for COLMAP MVP - GPU-Optimized Backend
# Optimized for Northflank deployment with NVIDIA A100 GPU acceleration
# Specs: A100 40GB VRAM, 12 vCPU, 85GB RAM

FROM nvidia/cuda:12.2.0-devel-ubuntu22.04

# Prevent interactive prompts during build
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# GPU Configuration
ENV CUDA_VISIBLE_DEVICES=0
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility

# Install system dependencies in smaller chunks to avoid I/O errors
# Build essentials first
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    wget \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# COLMAP core dependencies
RUN apt-get update && apt-get install -y \
    libboost-program-options-dev \
    libboost-filesystem-dev \
    libboost-graph-dev \
    libboost-system-dev \
    libboost-test-dev \
    libeigen3-dev \
    && rm -rf /var/lib/apt/lists/*

# COLMAP additional libraries
RUN apt-get update && apt-get install -y \
    libflann-dev \
    libfreeimage-dev \
    libmetis-dev \
    libgoogle-glog-dev \
    libgflags-dev \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Graphics and Qt dependencies
RUN apt-get update && apt-get install -y \
    libglew-dev \
    qtbase5-dev \
    libqt5opengl5-dev \
    libcgal-dev \
    libceres-dev \
    && rm -rf /var/lib/apt/lists/*

# OpenCV, Python, and FFmpeg
RUN apt-get update && apt-get install -y \
    libopencv-dev \
    python3-opencv \
    python3.10 \
    python3-pip \
    python3.10-venv \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install COLMAP from source (GPU-optimized build for A100)
WORKDIR /tmp
RUN git clone https://github.com/colmap/colmap.git && \
    cd colmap && \
    git checkout 3.12.6 && \
    mkdir build && \
    cd build && \
    cmake .. -DCMAKE_BUILD_TYPE=Release \
             -DCUDA_ENABLED=ON \
             -DCUDA_ARCHS="80" \
             -DGUI_ENABLED=OFF \
             -DCMAKE_CUDA_ARCHITECTURES=80 && \
    make -j12 && \
    make install && \
    cd /tmp && \
    rm -rf colmap

# Verify COLMAP installation
RUN colmap help

# Set working directory
WORKDIR /app

# Copy Python requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .
COPY database.py .

# Create necessary directories
RUN mkdir -p /app/data/results /app/data/uploads /app/data/cache

# Expose port (Northflank will map this)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python3", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]


