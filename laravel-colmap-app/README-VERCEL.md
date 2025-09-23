# 🚀 DoMapping - Laravel on Vercel

> **3D Visualization Platform** with COLMAP integration, optimized for Vercel serverless deployment.

## 🌟 Live Demo

**Frontend**: https://domapping.vercel.app  
**COLMAP Service**: https://domapping-colmap.vercel.app

## 📋 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/marco-interact/colmap-app/tree/main/laravel-colmap-app)

### Option 1: One-Click Deploy

1. Click the "Deploy with Vercel" button above
2. Connect your GitHub account
3. Configure environment variables (see below)
4. Deploy! 🚀

### Option 2: Manual Deploy

```bash
# Clone the repository
git clone https://github.com/marco-interact/colmap-app.git
cd colmap-app/laravel-colmap-app

# Install dependencies
composer install --optimize-autoloader --no-dev
npm install && npm run build

# Deploy to Vercel
vercel --prod
```

## 🔧 Environment Variables

Set these in your Vercel project settings:

### Required Variables
```bash
APP_KEY=base64:your-laravel-app-key-here
APP_URL=https://your-domain.vercel.app
COLMAP_SERVICE_URL=https://your-colmap-service.vercel.app
```

### Optional Variables
```bash
APP_DEBUG=false
LOG_LEVEL=info
MAX_FILE_SIZE=1048576
COLMAP_DEFAULT_QUALITY=medium
```

### Generate APP_KEY
```bash
php artisan key:generate --show
```

## 🏗️ Architecture

### Frontend (Laravel + LESS CSS)
- **Framework**: Laravel 12 with Blade templates
- **Styling**: Custom LESS CSS matching DoMapping design
- **Assets**: Vite for compilation and optimization
- **Authentication**: Built-in Laravel authentication

### Backend API Integration
- **COLMAP Service**: Python FastAPI microservice
- **File Upload**: 1GB video support
- **Job Management**: Real-time processing status
- **Database**: SQLite for serverless compatibility

### Serverless Configuration
- **Runtime**: PHP 8.2 with vercel-php
- **Entry Point**: `api/index.php`
- **Static Assets**: Optimized with Vite
- **Caching**: Array drivers for serverless

## 📁 Project Structure

```
laravel-colmap-app/
├── api/
│   └── index.php          # Vercel serverless entry point
├── app/
│   ├── Http/Controllers/  # Laravel controllers
│   └── Models/           # Eloquent models
├── config/
│   └── vercel.php        # Vercel-specific configuration
├── resources/
│   ├── views/            # Blade templates (DoMapping UI)
│   └── less/             # LESS CSS styling
├── public/
│   └── build/            # Compiled assets
├── vercel.json           # Vercel deployment configuration
└── .vercelignore        # Files to ignore during deployment
```

## 🎨 Features

### DoMapping UI
- ✅ **Dark Theme** with teal accent colors
- ✅ **Responsive Design** matching provided mockups
- ✅ **Project Management** with modal forms
- ✅ **Dashboard** with search and filtering
- ✅ **Authentication** with login/register

### COLMAP Integration
- ✅ **Video Upload** up to 1GB with progress tracking
- ✅ **Frame Extraction** from uploaded videos
- ✅ **3D Reconstruction** with quality settings
- ✅ **Job Monitoring** with real-time status updates
- ✅ **File Download** for processed 3D models

### Performance
- ✅ **Serverless Scaling** automatic with Vercel
- ✅ **Asset Optimization** with Vite bundling
- ✅ **CDN Distribution** global with Vercel Edge
- ✅ **SQLite Database** optimized for serverless

## 🛠️ Local Development

```bash
# Start Laravel development server
php artisan serve --port=8000

# Start asset compilation (in separate terminal)
npm run dev

# Start Python COLMAP service (in separate terminal)  
cd ../python-colmap-service
python main.py
```

**Access Points**:
- Frontend: http://localhost:8000
- COLMAP Service: http://localhost:8001

## 🔄 COLMAP Service Deployment

The Python COLMAP service needs to be deployed separately:

### Deploy Python Service to Vercel

```bash
cd ../python-colmap-service

# Create vercel.json for Python service
echo '{
  "version": 2,
  "builds": [
    {
      "src": "main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "main.py"
    }
  ]
}' > vercel.json

# Deploy
vercel --prod
```

## 📊 Database Configuration

For production, consider using:
- **PlanetScale** (MySQL)
- **Supabase** (PostgreSQL) 
- **SQLite** (included, good for demos)

### Using PlanetScale
```bash
# Environment variables
DB_CONNECTION=mysql
DB_HOST=your-planetscale-host
DB_PORT=3306
DB_DATABASE=your-database
DB_USERNAME=your-username
DB_PASSWORD=your-password
```

## 🚀 Deployment Checklist

### Before Deploying
- [ ] Generate `APP_KEY` and add to Vercel environment
- [ ] Build production assets with `npm run build`
- [ ] Test locally with `php artisan serve`
- [ ] Verify COLMAP service is deployed
- [ ] Configure environment variables in Vercel

### After Deploying
- [ ] Run database migrations (if using external DB)
- [ ] Test authentication flow
- [ ] Test project creation
- [ ] Test video upload (with small file)
- [ ] Test COLMAP integration
- [ ] Configure custom domain (optional)

## 🔧 Performance Optimization

### Laravel Optimization
- Uses array cache/session drivers for serverless
- Optimized autoloader with `--optimize-autoloader`
- Route caching disabled (not compatible with serverless)
- Config caching disabled (not compatible with serverless)

### Asset Optimization
- LESS CSS compiled to optimized CSS
- JavaScript bundled and minified with Vite
- Images optimized and compressed
- Static assets served with long-term caching

## 🐛 Troubleshooting

### Common Issues

**404 Errors**
- Ensure `api/index.php` exists and is configured correctly
- Check `vercel.json` routes configuration

**PHP Errors**
- Check Vercel function logs: `vercel logs`
- Ensure PHP 8.2 compatibility
- Verify all dependencies are installed

**Asset Loading Issues**
- Run `npm run build` to generate production assets
- Check asset URLs in browser devtools
- Verify Vite configuration

### Debug Commands
```bash
# Check Vercel deployment logs
vercel logs

# Test Laravel routes locally
php artisan route:list

# Test COLMAP service connection
curl https://your-colmap-service.vercel.app/health
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally and on Vercel
5. Submit a pull request

---

**🎉 Your DoMapping platform is now ready for Vercel!**

For questions or issues, please check the [troubleshooting section](#troubleshooting) or open an issue on GitHub.
