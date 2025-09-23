#!/bin/bash
echo "Building DoMapping Laravel app for Vercel..."
composer install --optimize-autoloader --no-dev --prefer-dist
npm ci
npm run build
echo "Build complete!"
