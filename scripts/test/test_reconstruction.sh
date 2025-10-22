#!/bin/bash
# Test video reconstruction pipeline

set -e

echo "🧪 Testing COLMAP Reconstruction Pipeline"
echo "=========================================="

# Create test video using FFmpeg
echo "📹 Creating test video..."
TEST_VIDEO="/tmp/test_video_$(date +%s).mp4"

# Create a simple test video with moving pattern (30 seconds, 30fps)
ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 \
  -vf "drawtext=text='Frame %{n}':fontsize=60:x=(w-text_w)/2:y=(h-text_h)/2:fontcolor=white" \
  -c:v libx264 -pix_fmt yuv420p -y "$TEST_VIDEO" 2>&1 | tail -5

if [ ! -f "$TEST_VIDEO" ]; then
    echo "❌ Failed to create test video"
    exit 1
fi

echo "✅ Test video created: $TEST_VIDEO"
ls -lh "$TEST_VIDEO"

# Upload video to API
echo ""
echo "📤 Uploading video to API..."
RESPONSE=$(curl -s -X POST http://localhost:8000/upload \
  -F "file=@$TEST_VIDEO" \
  -F "project_id=96d1fe75-e229-42b9-b90c-a2b8726b44ad" \
  -F "scan_name=Test Reconstruction $(date +%H:%M:%S)" \
  -F "quality=low")

echo "Response: $RESPONSE"

JOB_ID=$(echo "$RESPONSE" | grep -o '"job_id":"[^"]*"' | cut -d'"' -f4)
SCAN_ID=$(echo "$RESPONSE" | grep -o '"scan_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
    echo "❌ Failed to get job_id from response"
    exit 1
fi

echo "✅ Upload successful!"
echo "   Job ID: $JOB_ID"
echo "   Scan ID: $SCAN_ID"

# Monitor processing
echo ""
echo "⏳ Monitoring reconstruction progress..."
for i in {1..60}; do
    STATUS=$(curl -s "http://localhost:8000/processing/$JOB_ID/status")
    PROGRESS=$(echo "$STATUS" | grep -o '"progress":[0-9]*' | cut -d':' -f2)
    MESSAGE=$(echo "$STATUS" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    JOB_STATUS=$(echo "$STATUS" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    echo "[$i/60] Progress: $PROGRESS% - $MESSAGE (Status: $JOB_STATUS)"
    
    if [ "$JOB_STATUS" = "completed" ]; then
        echo ""
        echo "✅ Reconstruction completed!"
        echo ""
        echo "📊 Results:"
        curl -s "http://localhost:8000/scans/$SCAN_ID/details" | jq .
        
        # Check if PLY file exists
        RESULTS_DIR="data/results/$JOB_ID"
        if [ -f "$RESULTS_DIR/point_cloud.ply" ]; then
            echo ""
            echo "✅ Point cloud generated: $RESULTS_DIR/point_cloud.ply"
            ls -lh "$RESULTS_DIR/point_cloud.ply"
            head -15 "$RESULTS_DIR/point_cloud.ply"
        fi
        
        rm "$TEST_VIDEO"
        exit 0
    fi
    
    if [ "$JOB_STATUS" = "failed" ]; then
        echo ""
        echo "❌ Reconstruction failed!"
        echo "$STATUS" | jq .
        rm "$TEST_VIDEO"
        exit 1
    fi
    
    sleep 2
done

echo ""
echo "⏰ Timeout - reconstruction still processing"
rm "$TEST_VIDEO"





