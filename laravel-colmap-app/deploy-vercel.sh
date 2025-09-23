#!/bin/bash

# DoMapping - Vercel Deployment Script
# This script prepares and deploys the Laravel application to Vercel

set -e  # Exit on any error

echo "🚀 DoMapping - Vercel Deployment Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "artisan" ]; then
    print_error "This script must be run from the Laravel project root directory"
    exit 1
fi

print_status "Step 1: Installing PHP dependencies..."
composer install --optimize-autoloader --no-dev --prefer-dist
print_success "PHP dependencies installed"

print_status "Step 2: Installing Node.js dependencies..."
npm ci --only=production
print_success "Node.js dependencies installed"

print_status "Step 3: Building production assets..."
npm run build
print_success "Assets built successfully"

print_status "Step 4: Optimizing Laravel for production..."
php artisan optimize:clear
print_success "Laravel optimized"

print_status "Step 5: Checking Vercel configuration..."
if [ ! -f "vercel.json" ]; then
    print_error "vercel.json not found! Please ensure Vercel configuration exists."
    exit 1
fi

if [ ! -f "api/index.php" ]; then
    print_error "api/index.php not found! Please ensure Vercel entry point exists."
    exit 1
fi

print_success "Vercel configuration validated"

print_status "Step 6: Checking environment variables..."
print_warning "Make sure to set these environment variables in Vercel:"
echo "  - APP_KEY (generate with: php artisan key:generate --show)"
echo "  - APP_URL (your Vercel domain)"
echo "  - COLMAP_SERVICE_URL (your Python service URL)"

# Check if APP_KEY is set
if grep -q "APP_KEY=" .env 2>/dev/null; then
    print_success "APP_KEY found in .env file"
else
    print_warning "APP_KEY not found in .env - make sure to set it in Vercel"
fi

print_status "Step 7: Validating build output..."
if [ -d "public/build" ]; then
    print_success "Build directory exists"
    BUILD_SIZE=$(du -sh public/build | cut -f1)
    print_status "Build size: $BUILD_SIZE"
else
    print_error "Build directory not found! Assets may not have compiled correctly."
    exit 1
fi

print_status "Step 8: Ready to deploy to Vercel!"
echo ""
echo "🎯 Deployment Commands:"
echo "  For new project:"
echo "    vercel"
echo ""
echo "  For production deployment:"
echo "    vercel --prod"
echo ""
echo "  To set environment variables:"
echo "    vercel env add APP_KEY"
echo "    vercel env add APP_URL"
echo "    vercel env add COLMAP_SERVICE_URL"
echo ""

print_success "Laravel application is ready for Vercel deployment!"
echo ""
echo "📚 Next Steps:"
echo "1. Run 'vercel' to deploy (follow the prompts)"
echo "2. Set environment variables in Vercel dashboard"
echo "3. Deploy Python COLMAP service separately"
echo "4. Test the deployed application"
echo ""
echo "🔗 Useful Links:"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- Deployment Logs: vercel logs"
echo "- Documentation: See README-VERCEL.md"
echo ""

print_success "🎉 Ready to go!"
