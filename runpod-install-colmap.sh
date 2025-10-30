#!/bin/bash
# Install COLMAP on RunPod
# Run this in the RunPod terminal

set -e

echo "🔧 Installing COLMAP on RunPod..."

# Update packages
sudo apt-get update

# Install dependencies
sudo apt-get install -y \
    git \
    cmake \
    build-essential \
    libboost-program-options-dev \
    libboost-filesystem-dev \
    libboost-graph-dev \
    libboost-system-dev \
    libboost-test-dev \
    libeigen3-dev \
    libflann-dev \
    libfreeimage-dev \
    libmetis-dev \
    libgoogle-glog-dev \
    libgflags-dev \
    libsqlite3-dev \
    libglew-dev \
    qtbase5-dev \
    libqt5opengl5-dev \
    libcgal-dev \
    libceres-dev

# Clone COLMAP
cd /tmp
if [ -d "colmap" ]; then
    rm -rf colmap
fi
git clone https://github.com/colmap/colmap.git
cd colmap

# Build COLMAP
mkdir build
cd build
cmake .. -DCMAKE_CUDA_ARCHITECTURES=native
make -j$(nproc)
sudo make install

# Verify installation
colmap --version

echo "✅ COLMAP installed successfully!"

# Test command
echo "🧪 Testing COLMAP..."
colmap --help

echo "✅ Ready to use COLMAP for 3D reconstruction!"

