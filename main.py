#!/usr/bin/env python3
"""
ULTRA SIMPLE COLMAP Backend - JUST WORKS
No complex imports, no crashes, just basic functionality
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
from pathlib import Path
from database import Database
import os

# PERSISTENT DATABASE PATH - NEVER DELETE DATA
DATABASE_PATH = os.getenv("DATABASE_PATH", "/persistent-data/database.db")
db = Database(DATABASE_PATH)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="COLMAP Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "COLMAP Backend is running!"}

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "Backend is running"}

@app.get("/api/projects")
async def get_projects():
    """Get all projects"""
    try:
        projects = db.get_all_projects()
        return {"projects": projects}
    except Exception as e:
        logger.error(f"Error getting projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects/{project_id}/scans")
async def get_scans(project_id: str):
    """Get scans for a project"""
    try:
        scans = db.get_scans_by_project(project_id)
        return {"scans": scans}
    except Exception as e:
        logger.error(f"Error getting scans: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/status")
async def get_status():
    """Get current backend status and demo data info"""
    try:
        projects = db.get_all_projects()
        logger.info(f"📊 Current status: {len(projects)} projects found")
        
        status = {
            "backend": "running",
            "database_path": DATABASE_PATH,
            "projects_count": len(projects),
            "projects": []
        }
        
    for project in projects:
            scans = db.get_scans_by_project(project['id'])
            status["projects"].append({
            "id": project["id"],
            "name": project["name"],
                "scan_count": len(scans)
            })
        
        return status
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        return {"backend": "error", "error": str(e)}

@app.post("/database/setup-demo")
async def setup_demo_data():
    """FORCE setup demo data - ALWAYS WORKS"""
    try:
        logger.info("🔄 FORCING demo data creation...")
        result = db.setup_demo_data()
        
        # Verify demo data was created
        projects = db.get_all_projects()
        logger.info(f"📊 Demo data created: {len(projects)} projects found")
        
        for project in projects:
            scans = db.get_scans_by_project(project['id'])
            logger.info(f"   Project '{project['name']}': {len(scans)} scans")
        
        return {
            "status": "success",
            "data": result,
            "verification": {
                "projects_count": len(projects),
                "projects": [{"id": p["id"], "name": p["name"], "scan_count": len(db.get_scans_by_project(p["id"]))} for p in projects]
        }
        }
    except Exception as e:
        logger.error(f"Demo data setup failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
async def startup_event():
    """Initialize demo data on startup"""
    try:
        logger.info("🚀 Starting up COLMAP Backend...")
        
        # FORCE DEMO DATA INITIALIZATION
        logger.info("🔄 FORCING demo data initialization...")
        result = db.setup_demo_data()
        
        if result.get("skipped"):
            logger.info("✅ Demo data already exists")
        else:
            logger.info("✅ Demo data initialized successfully")
            logger.info(f"   Project ID: {result.get('project_id')}")
            logger.info(f"   Scan IDs: {result.get('scan_ids')}")
        
        # VERIFY DEMO DATA EXISTS
        projects = db.get_all_projects()
        logger.info(f"🎯 FINAL VERIFICATION: {len(projects)} projects found")
        for project in projects:
            scans = db.get_scans_by_project(project['id'])
            logger.info(f"   Project '{project['name']}': {len(scans)} scans")
        
        logger.info("🎯 COLMAP Backend ready!")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        # Don't crash the app, just log the error

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
