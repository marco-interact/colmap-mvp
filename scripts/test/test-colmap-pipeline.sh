#!/bin/bash
# Test COLMAP pipeline with a sample video

echo "🧪 Testing COLMAP Pipeline"
echo "=========================="
echo ""

# Create a simple test video using OpenCV (5 seconds, rotating camera)
python3 - << 'EOF'
import cv2
import numpy as np
import tempfile
import os

# Create a simple test video with changing patterns
width, height = 640, 480
fps = 30
duration = 3  # 3 seconds

output_path = "/tmp/colmap_test_video.mp4"
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

for frame_num in range(int(fps * duration)):
    # Create a frame with moving patterns
    img = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Draw some features that change over time
    angle = frame_num * 5
    center_x = width // 2 + int(50 * np.sin(np.radians(angle)))
    center_y = height // 2 + int(50 * np.cos(np.radians(angle)))
    
    # Draw circles at different positions
    cv2.circle(img, (center_x, center_y), 50, (255, 0, 0), -1)
    cv2.circle(img, (width - center_x, height - center_y), 30, (0, 255, 0), -1)
    cv2.rectangle(img, (100 + frame_num*2, 100), (200 + frame_num*2, 200), (0, 0, 255), -1)
    
    # Add some text
    cv2.putText(img, f"Frame {frame_num}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    
    out.write(img)

out.release()
print(f"Created test video: {output_path}")
print(f"Size: {os.path.getsize(output_path) / 1024:.1f} KB")
EOF

echo ""
echo "📤 Uploading test video to COLMAP backend..."

# Get the demo project ID
PROJECT_ID=$(curl -s http://localhost:8000/projects | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['projects'][0]['id'])")

echo "Using project: $PROJECT_ID"

# Upload the test video
RESPONSE=$(curl -s -X POST http://localhost:8000/upload-video \
  -F "video=@/tmp/colmap_test_video.mp4;type=video/mp4" \
  -F "project_id=$PROJECT_ID" \
  -F "scan_name=COLMAP Pipeline Test" \
  -F "quality=low" \
  -F "user_email=demo@colmap.app")

echo ""
echo "Upload response:"
echo "$RESPONSE" | python3 -m json.tool

# Extract job ID
JOB_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('job_id', ''))")

if [ -z "$JOB_ID" ]; then
    echo "❌ Failed to upload video"
    exit 1
fi

echo ""
echo "✅ Video uploaded! Job ID: $JOB_ID"
echo "📊 Monitoring processing status..."
echo ""

# Monitor the job status
for i in {1..30}; do
    STATUS=$(curl -s http://localhost:8000/jobs/$JOB_ID)
    
    CURRENT_STATUS=$(echo "$STATUS" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('status', 'unknown'))")
    PROGRESS=$(echo "$STATUS" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('progress', 0))")
    STAGE=$(echo "$STATUS" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('current_stage', 'Unknown'))")
    MESSAGE=$(echo "$STATUS" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('message', ''))")
    
    echo "[$(date +%H:%M:%S)] Status: $CURRENT_STATUS | Progress: $PROGRESS% | Stage: $STAGE"
    echo "  Message: $MESSAGE"
    
    if [ "$CURRENT_STATUS" == "completed" ]; then
        echo ""
        echo "✅ COLMAP processing completed successfully!"
        echo ""
        echo "Full results:"
        echo "$STATUS" | python3 -m json.tool
        
        # Check for output files
        echo ""
        echo "📁 Checking output files..."
        if [ -d "data/results/$JOB_ID" ]; then
            ls -lh "data/results/$JOB_ID"
        fi
        
        exit 0
    elif [ "$CURRENT_STATUS" == "failed" ]; then
        echo ""
        echo "❌ COLMAP processing failed!"
        echo "Error: $MESSAGE"
        echo ""
        echo "Full response:"
        echo "$STATUS" | python3 -m json.tool
        exit 1
    fi
    
    sleep 5
done

echo ""
echo "⏱️  Processing is taking longer than expected (>2.5 minutes)"
echo "Check backend logs: tail -f backend.log"


