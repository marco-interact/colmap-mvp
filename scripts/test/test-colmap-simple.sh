#!/bin/bash
# Simple COLMAP test using a downloaded sample video

echo "🧪 Testing COLMAP Pipeline (Simple)"
echo "===================================="
echo ""

# Download a small sample video if it doesn't exist
if [ ! -f "/tmp/colmap_test.mp4" ]; then
    echo "📥 Downloading sample video..."
    curl -L -o /tmp/colmap_test.mp4 "https://sample-videos.com/video321/mp4/240/big_buck_bunny_240p_1mb.mp4" 2>&1 | grep -E "(progress|saved)"
    
    if [ ! -f "/tmp/colmap_test.mp4" ]; then
        echo "❌ Failed to download video. Creating a dummy video..."
        # Create a small dummy MP4 file (won't work but will test the pipeline)
        echo "This is not a real video" > /tmp/colmap_test.mp4
    fi
    
    echo "✅ Video ready: $(ls -lh /tmp/colmap_test.mp4 | awk '{print $5}')"
fi

echo ""
echo "📤 Uploading test video to COLMAP backend..."

# Get the demo project ID
PROJECT_ID=$(curl -s http://localhost:8000/projects | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['projects'][0]['id']) if data.get('projects') else print('')" 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo "❌ No projects found. Make sure backend is running."
    exit 1
fi

echo "Using project: $PROJECT_ID"

# Upload the test video
RESPONSE=$(curl -s -X POST http://localhost:8000/upload-video \
  -F "video=@/tmp/colmap_test.mp4;type=video/mp4" \
  -F "project_id=$PROJECT_ID" \
  -F "scan_name=COLMAP Pipeline Test" \
  -F "quality=low" \
  -F "user_email=demo@colmap.app")

echo ""
echo "Upload response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Extract job ID
JOB_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('job_id', ''))" 2>/dev/null)

if [ -z "$JOB_ID" ]; then
    echo "❌ Failed to upload video or extract job ID"
    exit 1
fi

echo ""
echo "✅ Video uploaded! Job ID: $JOB_ID"
echo "📊 Monitoring processing status..."
echo ""

# Monitor the job status
for i in {1..60}; do
    STATUS=$(curl -s http://localhost:8000/jobs/$JOB_ID 2>/dev/null)
    
    if [ -z "$STATUS" ]; then
        echo "⚠️  Could not fetch status"
        sleep 5
        continue
    fi
    
    CURRENT_STATUS=$(echo "$STATUS" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('status', 'unknown'))" 2>/dev/null)
    PROGRESS=$(echo "$STATUS" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('progress', 0))" 2>/dev/null)
    STAGE=$(echo "$STATUS" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('current_stage', 'Unknown'))" 2>/dev/null)
    MESSAGE=$(echo "$STATUS" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('message', ''))" 2>/dev/null)
    
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
            echo "Output directory contents:"
            ls -lh "data/results/$JOB_ID"
            if [ -d "data/results/$JOB_ID/images" ]; then
                echo ""
                echo "Sample images:"
                ls -lh "data/results/$JOB_ID/images"
            fi
        else
            echo "No output directory found at data/results/$JOB_ID"
        fi
        
        exit 0
    elif [ "$CURRENT_STATUS" == "failed" ]; then
        echo ""
        echo "❌ COLMAP processing failed!"
        echo "Error: $MESSAGE"
        echo ""
        echo "Full response:"
        echo "$STATUS" | python3 -m json.tool
        
        # Check backend logs for more details
        echo ""
        echo "📋 Recent backend logs:"
        tail -20 backend.log | grep -E "(ERROR|WARN|colmap|feature|frame)" || tail -20 backend.log
        
        exit 1
    fi
    
    sleep 5
done

echo ""
echo "⏱️  Processing is taking longer than expected (>5 minutes)"
echo "The job is still running in the background."
echo ""
echo "To check status manually:"
echo "  curl http://localhost:8000/jobs/$JOB_ID | python3 -m json.tool"
echo ""
echo "To check backend logs:"
echo "  tail -f backend.log"


