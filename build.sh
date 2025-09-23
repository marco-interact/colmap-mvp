#!/bin/bash
echo "Building COLMAP App Laravel app for Vercel..."
composer install --optimize-autoloader --no-dev --prefer-dist
npm ci
npm run build
echo "Build complete!"
