"""
SQLite Database Implementation for COLMAP App
Stores users, projects, scans, and technical details
"""

import sqlite3
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
import uuid

logger = logging.getLogger(__name__)

class Database:
    """Simple SQLite database for storing COLMAP app data"""
    
    def __init__(self, db_path: str = "/tmp/colmap_app.db"):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Get database connection with row factory"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable dict-like access to rows
        return conn
    
    def init_database(self):
        """Initialize database tables"""
        conn = self.get_connection()
        try:
            # Users table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Projects table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    location TEXT,
                    space_type TEXT,
                    project_type TEXT,
                    status TEXT DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            # Scans table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS scans (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    video_filename TEXT,
                    video_size INTEGER,
                    video_duration REAL,
                    processing_quality TEXT DEFAULT 'medium',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (project_id) REFERENCES projects (id)
                )
            ''')
            
            # Technical details table (stores COLMAP processing results)
            conn.execute('''
                CREATE TABLE IF NOT EXISTS scan_technical_details (
                    scan_id TEXT PRIMARY KEY,
                    point_count INTEGER,
                    camera_count INTEGER,
                    feature_count INTEGER,
                    processing_time_seconds REAL,
                    resolution TEXT,
                    file_size_bytes INTEGER,
                    reconstruction_error REAL,
                    coverage_percentage REAL,
                    processing_stages TEXT, -- JSON array of processing stages
                    results TEXT, -- JSON object with file URLs
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (scan_id) REFERENCES scans (id)
                )
            ''')
            
            # Processing jobs table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS processing_jobs (
                    job_id TEXT PRIMARY KEY,
                    scan_id TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    progress INTEGER DEFAULT 0,
                    current_stage TEXT,
                    message TEXT,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    FOREIGN KEY (scan_id) REFERENCES scans (id)
                )
            ''')
            
            conn.commit()
            logger.info("Database initialized successfully")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    # User methods
    def create_user(self, email: str, name: Optional[str] = None) -> str:
        """Create a new user"""
        user_id = str(uuid.uuid4())
        conn = self.get_connection()
        try:
            conn.execute(
                'INSERT INTO users (id, email, name) VALUES (?, ?, ?)',
                (user_id, email, name)
            )
            conn.commit()
            logger.info(f"Created user: {email}")
            return user_id
        except sqlite3.IntegrityError:
            # User already exists, return existing user_id
            row = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
            return row['id'] if row else user_id
        finally:
            conn.close()
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        conn = self.get_connection()
        try:
            row = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
    
    # Project methods
    def create_project(self, user_id: str, name: str, description: str = "", 
                      location: str = "", space_type: str = "", project_type: str = "") -> str:
        """Create a new project"""
        project_id = str(uuid.uuid4())
        conn = self.get_connection()
        try:
            conn.execute('''
                INSERT INTO projects (id, user_id, name, description, location, space_type, project_type)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (project_id, user_id, name, description, location, space_type, project_type))
            conn.commit()
            logger.info(f"Created project: {name}")
            return project_id
        finally:
            conn.close()
    
    def get_user_projects(self, user_id: str) -> List[Dict]:
        """Get all projects for a user"""
        conn = self.get_connection()
        try:
            rows = conn.execute('''
                SELECT p.*, COUNT(s.id) as scan_count
                FROM projects p
                LEFT JOIN scans s ON p.id = s.project_id
                WHERE p.user_id = ?
                GROUP BY p.id
                ORDER BY p.updated_at DESC
            ''', (user_id,)).fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()
    
    def get_project(self, project_id: str) -> Optional[Dict]:
        """Get a project by ID"""
        conn = self.get_connection()
        try:
            row = conn.execute('SELECT * FROM projects WHERE id = ?', (project_id,)).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
    
    # Scan methods
    def create_scan(self, project_id: str, name: str, video_filename: str, 
                   video_size: int, processing_quality: str = "medium") -> str:
        """Create a new scan"""
        scan_id = str(uuid.uuid4())
        conn = self.get_connection()
        try:
            conn.execute('''
                INSERT INTO scans (id, project_id, name, video_filename, video_size, processing_quality)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (scan_id, project_id, name, video_filename, video_size, processing_quality))
            
            # Update project updated_at
            conn.execute(
                'UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                (project_id,)
            )
            
            conn.commit()
            logger.info(f"Created scan: {name}")
            return scan_id
        finally:
            conn.close()
    
    def get_project_scans(self, project_id: str) -> List[Dict]:
        """Get all scans for a project"""
        conn = self.get_connection()
        try:
            rows = conn.execute('''
                SELECT s.*, 
                       std.point_count,
                       std.processing_time_seconds,
                       std.file_size_bytes
                FROM scans s
                LEFT JOIN scan_technical_details std ON s.id = std.scan_id
                WHERE s.project_id = ?
                ORDER BY s.created_at DESC
            ''', (project_id,)).fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()
    
    def get_scan(self, scan_id: str) -> Optional[Dict]:
        """Get a scan by ID"""
        conn = self.get_connection()
        try:
            row = conn.execute('SELECT * FROM scans WHERE id = ?', (scan_id,)).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
    
    def update_scan_status(self, scan_id: str, status: str):
        """Update scan status"""
        conn = self.get_connection()
        try:
            conn.execute(
                'UPDATE scans SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                (status, scan_id)
            )
            conn.commit()
        finally:
            conn.close()
    
    # Technical details methods
    def save_scan_technical_details(self, scan_id: str, technical_data: Dict[str, Any]):
        """Save technical details from COLMAP processing"""
        conn = self.get_connection()
        try:
            # Convert nested objects to JSON
            processing_stages = json.dumps(technical_data.get('processing_stages', []))
            results = json.dumps(technical_data.get('results', {}))
            
            conn.execute('''
                INSERT OR REPLACE INTO scan_technical_details 
                (scan_id, point_count, camera_count, feature_count, processing_time_seconds,
                 resolution, file_size_bytes, reconstruction_error, coverage_percentage,
                 processing_stages, results)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                scan_id,
                technical_data.get('point_count'),
                technical_data.get('camera_count'),
                technical_data.get('feature_count'),
                technical_data.get('processing_time_seconds'),
                technical_data.get('resolution'),
                technical_data.get('file_size_bytes'),
                technical_data.get('reconstruction_error'),
                technical_data.get('coverage_percentage'),
                processing_stages,
                results
            ))
            
            # Update scan status to completed
            conn.execute(
                'UPDATE scans SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                ('completed', scan_id)
            )
            
            conn.commit()
            logger.info(f"Saved technical details for scan: {scan_id}")
        finally:
            conn.close()
    
    def get_scan_details(self, scan_id: str) -> Optional[Dict]:
        """Get complete scan details including technical data"""
        conn = self.get_connection()
        try:
            row = conn.execute('''
                SELECT s.*,
                       p.name as project_name,
                       p.location as project_location,
                       std.point_count,
                       std.camera_count,
                       std.feature_count,
                       std.processing_time_seconds,
                       std.resolution,
                       std.file_size_bytes,
                       std.reconstruction_error,
                       std.coverage_percentage,
                       std.processing_stages,
                       std.results
                FROM scans s
                LEFT JOIN projects p ON s.project_id = p.id
                LEFT JOIN scan_technical_details std ON s.id = std.scan_id
                WHERE s.id = ?
            ''', (scan_id,)).fetchone()
            
            if not row:
                return None
            
            data = dict(row)
            
            # Parse JSON fields
            if data.get('processing_stages'):
                data['processing_stages'] = json.loads(data['processing_stages'])
            if data.get('results'):
                data['results'] = json.loads(data['results'])
            
            return data
        finally:
            conn.close()

# Global database instance
db = Database()
