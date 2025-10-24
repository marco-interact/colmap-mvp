#!/usr/bin/env python3
"""
SUPER SIMPLE BACKEND TEST - JUST CHECK IF IT WORKS
"""

import requests
import json

def test_backend():
    """Test if backend is running and has demo data"""
    
    # Test backend health
    try:
        print("🔍 Testing backend health...")
        response = requests.get("http://localhost:8000/health", timeout=5)
        print(f"✅ Health check: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return
    
    # Test status endpoint
    try:
        print("\n🔍 Testing status endpoint...")
        response = requests.get("http://localhost:8000/api/status", timeout=5)
        print(f"✅ Status check: {response.status_code}")
        status = response.json()
        print(f"   Backend: {status.get('backend')}")
        print(f"   Database path: {status.get('database_path')}")
        print(f"   Projects count: {status.get('projects_count')}")
        print(f"   Projects: {status.get('projects')}")
    except Exception as e:
        print(f"❌ Status check failed: {e}")
    
    # Test projects endpoint
    try:
        print("\n🔍 Testing projects endpoint...")
        response = requests.get("http://localhost:8000/api/projects", timeout=5)
        print(f"✅ Projects check: {response.status_code}")
        projects = response.json()
        print(f"   Projects: {json.dumps(projects, indent=2)}")
    except Exception as e:
        print(f"❌ Projects check failed: {e}")
    
    # Test manual demo creation
    try:
        print("\n🔍 Testing manual demo creation...")
        response = requests.post("http://localhost:8000/database/setup-demo", timeout=10)
        print(f"✅ Demo creation: {response.status_code}")
        result = response.json()
        print(f"   Result: {json.dumps(result, indent=2)}")
    except Exception as e:
        print(f"❌ Demo creation failed: {e}")

if __name__ == "__main__":
    test_backend()
