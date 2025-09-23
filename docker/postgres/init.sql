-- Initialize 3D Platform Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE 3d_platform'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '3d_platform')\gexec

-- Connect to the database
\c 3d_platform;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
-- These will be created by SQLAlchemy, but we can add custom ones here

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE 3d_platform TO postgres;



