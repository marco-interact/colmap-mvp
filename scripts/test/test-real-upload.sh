#!/bin/bash
# Test if COLMAP processing actually works

echo "🧪 Testing Real COLMAP Processing"
echo "===================================="
echo ""

BACKEND_URL="https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run"

# First, get a project ID
echo "1️⃣ Getting test project..."
PROJECT_ID=$(curl -s "$BACKEND_URL/users/test@colmap.app/projects" | jq -r '.[0].id')

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
    echo "❌ No project found. Creating one..."
    # Create a test project
    curl -X POST "$BACKEND_URL/projects" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "user_email=test@colmap.app&name=Test%20Project&description=Test&location=Test&space_type=indoor&project_type=architecture"
    PROJECT_ID=$(curl -s "$BACKEND_URL/users/test@colmap.app/projects" | jq -r '.[0].id')
fi

echo "✅ Using project ID: $PROJECT_ID"
echo ""

# Create a minimal test video (requires ffmpeg)
echo "2️⃣ Creating test video..."
if command -v ffmpeg &> /dev/null; then
    # Create a 5-second test video
    ffmpeg -f lavfi -i testsrc=duration=5:size=640x480:rate=30 \
           -f lavfi -i sine=frequency=1000:duration=5 \
           -pix_fmt yuv420p \
           -y /tmp/test-colmap-video.mp4 2>&1 | tail -5
    
    if [ -f /tmp/test-colmap-video.mp4 ]; then
        echo "✅ Test video created: $(ls -lh /tmp/test-colmap-video.mp4 | awk '{print $5}')"
    else
        echo "❌ Failed to create test video"
        exit 1
    fi
else
    echo "⚠️  ffmpeg not found. Using curl to test upload endpoint instead."
    echo ""
    echo "3️⃣ Testing upload endpoint availability..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/upload-video")
    if [ "$HTTP_CODE" = "422" ] || [ "$HTTP_CODE" = "400" ]; then
        echo "✅ Upload endpoint is available (returned $HTTP_CODE - missing params is expected)"
    else
        echo "❌ Upload endpoint returned unexpected code: $HTTP_CODE"
    fi
    echo ""
    echo "📋 To fully test COLMAP:"
    echo "1. Download a test video: https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
    echo "2. Upload it via frontend UI"
    echo "3. Monitor processing with: watch -n 5 'curl -s $BACKEND_URL/jobs/JOB_ID | jq .'"
    exit 0
fi

echo ""
echo "3️⃣ Uploading test video to backend..."
UPLOAD_RESULT=$(curl -X POST "$BACKEND_URL/upload-video" \
    -F "video=@/tmp/test-colmap-video.mp4" \
    -F "project_id=$PROJECT_ID" \
    -F "scan_name=Test Upload $(date +%H:%M:%S)" \
    -F "quality=low" \
    -F "user_email=test@colmap.app" 2>/dev/null)

echo "$UPLOAD_RESULT" | jq .

JOB_ID=$(echo "$UPLOAD_RESULT" | jq -r '.job_id')

if [ -z "$JOB_ID" ] || [ "$JOB_ID" = "null" ]; then
    echo "❌ Upload failed!"
    echo "Response: $UPLOAD_RESULT"
    exit 1
fi

echo ""
echo "✅ Upload successful! Job ID: $JOB_ID"
echo ""
echo "4️⃣ Monitoring processing (30 seconds)..."
echo ""

for i in {1..6}; do
    sleep 5
    STATUS=$(curl -s "$BACKEND_URL/jobs/$JOB_ID")
    
    CURRENT_STATUS=$(echo "$STATUS" | jq -r '.status')
    PROGRESS=$(echo "$STATUS" | jq -r '.progress')
    STAGE=$(echo "$STATUS" | jq -r '.current_stage')
    MESSAGE=$(echo "$STATUS" | jq -r '.message')
    
    echo "[$i/6] Status: $CURRENT_STATUS | Progress: $PROGRESS% | Stage: $STAGE"
    
    if [ "$CURRENT_STATUS" = "completed" ]; then
        echo ""
        echo "🎉 Processing completed successfully!"
        echo ""
        echo "Results:"
        echo "$STATUS" | jq '.results'
        echo ""
        echo "✅ COLMAP is WORKING!"
        exit 0
    fi
    
    if [ "$CURRENT_STATUS" = "failed" ]; then
        echo ""
        echo "❌ Processing failed!"
        echo "Error: $MESSAGE"
        echo ""
        echo "This suggests COLMAP may not be installed or configured correctly."
        exit 1
    fi
done

echo ""
echo "⏱️  Processing is ongoing (this can take 5-10 minutes)"
echo ""
echo "Monitor with:"
echo "  watch -n 5 'curl -s $BACKEND_URL/jobs/$JOB_ID | jq .'"
echo ""
echo "Check when done:"
echo "  curl -s $BACKEND_URL/jobs/$JOB_ID | jq ."
echo ""

# Cleanup
rm -f /tmp/test-colmap-video.mp4


