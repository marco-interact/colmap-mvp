#!/bin/sh

# Frontend startup script for production
echo "Starting 3D Platform Frontend (Production)..."

# Replace environment variables in built files if needed
if [ -n "$REACT_APP_API_URL" ]; then
    echo "Configuring API URL: $REACT_APP_API_URL"
fi

# Start nginx in foreground
echo "Starting Nginx..."
nginx -g "daemon off;"
