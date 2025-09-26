"""
Test cases for the COLMAP Worker API
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_endpoint():
    """Test the root health endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "COLMAP Worker API"
    assert data["status"] == "running"
    assert data["version"] == "2.0.0"
    assert "gpu_enabled" in data
    assert "timestamp" in data

def test_health_endpoint():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "colmap-worker"
    assert data["version"] == "2.0.0"
    assert "gpu_status" in data
    assert "timestamp" in data
    assert "memory_usage" in data

def test_readiness_endpoint():
    """Test the readiness probe endpoint"""
    response = client.get("/readiness")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert "timestamp" in data

def test_video_upload():
    """Test video upload endpoint"""
    test_request = {
        "project_id": "test_project_123",
        "video_url": "https://example.com/test_video.mp4",
        "quality": "high",
        "dense_reconstruction": True,
        "meshing": True
    }
    
    response = client.post("/upload-video", json=test_request)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "queued"
    assert "job_id" in data
    assert "GPU-accelerated" in data["message"]
    assert "created_at" in data

def test_job_status():
    """Test job status retrieval"""
    # First create a job
    test_request = {
        "project_id": "test_project_456",
        "video_url": "https://example.com/test_video2.mp4"
    }
    
    upload_response = client.post("/upload-video", json=test_request)
    job_id = upload_response.json()["job_id"]
    
    # Then check its status
    status_response = client.get(f"/jobs/{job_id}")
    assert status_response.status_code == 200
    data = status_response.json()
    assert "status" in data
    assert "project_id" in data
    assert data["project_id"] == "test_project_456"

def test_nonexistent_job():
    """Test retrieving a non-existent job"""
    response = client.get("/jobs/nonexistent_job_id")
    assert response.status_code == 404
    assert "Job not found" in response.json()["detail"]

def test_download_endpoint():
    """Test file download endpoint"""
    response = client.get("/download/test_project/pointcloud")
    assert response.status_code == 200
    data = response.json()
    assert data["project_id"] == "test_project"
    assert data["file_type"] == "pointcloud"
    assert "mock endpoint" in data["note"]

if __name__ == "__main__":
    pytest.main([__file__])
