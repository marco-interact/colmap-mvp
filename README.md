# 🚀 DoMapping - 3D Visualization Platform

> **Laravel + COLMAP Integration** - Production-ready for Vercel deployment

## 🌟 Live Demo

**Deploy to Vercel**: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/marco-interact/colmap-app)

## ✨ Features

### 🎨 DoMapping UI
- **Dark theme** with teal accent colors matching design mockups
- **Responsive sidebar** navigation with user info
- **"Mis Proyectos"** dashboard with search and project cards
- **Modal forms** for creating new projects
- **Authentication** system with login/register

### 🛠️ COLMAP Integration
- **Video upload** support up to 1GB with progress tracking
- **Frame extraction** from uploaded videos
- **3D reconstruction** with multiple quality settings (low, medium, high, extreme)
- **Real-time job monitoring** with status updates
- **File download** for processed 3D models (.ply, .obj files)

### ⚡ Technical Stack
- **Frontend**: Laravel 12 + Blade templates + LESS CSS
- **Backend**: PHP 8.2 with Eloquent ORM
- **3D Processing**: Python FastAPI + COLMAP (separate microservice)
- **Database**: SQLite (serverless) or external database
- **Deployment**: Vercel serverless functions

## 🚀 Quick Deploy

### One-Click Vercel Deployment

1. **Deploy Main App**:
   - Repository: `marco-interact/colmap-app`
   - Framework: Other
   - Root Directory: `/` (project root)

2. **Deploy COLMAP Service** (separate deployment):
   - Repository: `marco-interact/colmap-app`
   - Framework: Python
   - Root Directory: `python-colmap-service`

### Environment Variables

Set in Vercel dashboard:

```bash
# Required
APP_KEY=base64:your-laravel-app-key-here
APP_URL=https://your-domain.vercel.app
COLMAP_SERVICE_URL=https://your-colmap-service.vercel.app

# Optional
APP_DEBUG=false
LOG_LEVEL=info
MAX_FILE_SIZE=1048576
COLMAP_DEFAULT_QUALITY=medium
```

Generate APP_KEY:
```bash
php artisan key:generate --show
```

## 🏗️ Architecture

```
colmap-app/
├── api/index.php              # Vercel serverless entry point
├── app/                       # Laravel application logic
├── resources/                 # Views, LESS CSS, assets
├── public/                    # Public assets
├── config/                    # Laravel configuration
├── database/                  # Migrations, models
├── python-colmap-service/     # Separate Python microservice
├── vercel.json               # Vercel deployment config
└── deploy-vercel.sh          # Deployment script
```

## 🎨 DoMapping UI Implementation

### User Flow
1. **Login/Register** → Laravel authentication
2. **Dashboard** → "Mis Proyectos" with project grid
3. **Create Project** → Modal form with project details
4. **Upload Video** → Drag & drop interface, up to 1GB
5. **Process Video** → COLMAP 3D reconstruction
6. **Monitor Progress** → Real-time status updates
7. **Download Results** → 3D models and point clouds

### Design System
- **Colors**: Dark theme (`#1a1a1a`) with teal accent (`#4ade80`)
- **Typography**: Inter font family
- **Layout**: Sidebar navigation with main content area
- **Components**: Cards, modals, forms, buttons with consistent styling

## 🛠️ Local Development

```bash
# Install dependencies
composer install
npm install

# Set up environment
cp .env.example .env
php artisan key:generate

# Build assets
npm run build

# Start Laravel server
php artisan serve

# Start Python COLMAP service (separate terminal)
cd python-colmap-service
python main.py
```

## 📦 Vercel Deployment

### Automatic Deployment Script

```bash
# Run deployment preparation
./deploy-vercel.sh

# Deploy to Vercel
vercel --prod
```

### Manual Steps

1. **Prepare Laravel**:
   ```bash
   composer install --optimize-autoloader --no-dev
   npm run build
   php artisan optimize:clear
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables** in Vercel dashboard

4. **Deploy Python Service** separately:
   ```bash
   cd python-colmap-service
   vercel --prod
   ```

## 🔧 Configuration Files

### `vercel.json` - Main Laravel App
Configures PHP 8.2 runtime, routes, and environment variables for serverless deployment.

### `api/index.php` - Serverless Entry Point
Bootstraps Laravel application for Vercel's serverless environment.

### `python-colmap-service/vercel.json` - COLMAP Service
Separate Python service configuration for 3D processing.

## 🎯 User Experience

### Dashboard Features
- **Project Cards**: Visual grid with thumbnails and status
- **Search**: Real-time project filtering
- **Create Button**: Modal form for new projects
- **User Profile**: Avatar and account info in sidebar

### Project Management
- **Status Tracking**: Created, Processing, Completed, Failed states
- **Progress Monitoring**: Real-time updates during COLMAP processing
- **File Management**: Upload videos, download results
- **Settings**: Quality preferences, processing options

## 🔒 Security & Performance

### Security
- **Laravel Authentication**: Built-in user management
- **CSRF Protection**: All forms protected
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: Type and size validation

### Performance
- **Asset Optimization**: Vite bundling and minification
- **Serverless Scaling**: Automatic with Vercel
- **CDN Distribution**: Global edge network
- **Database Optimization**: Efficient queries and caching

## 📊 Database Schema

### Projects Table
- `id`, `name`, `description`, `status`, `user_id`
- `settings` (JSON), `thumbnail`, `created_at`, `updated_at`

### Scans Table
- `id`, `name`, `project_id`, `video_filename`, `video_path`
- `status`, `processing_results` (JSON), `model_path`

### Processing Jobs Table
- `id`, `job_id`, `scan_id`, `type`, `status`, `progress`
- `message`, `started_at`, `completed_at`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/marco-interact/colmap-app/issues)
- **Documentation**: [README-VERCEL.md](README-VERCEL.md)
- **Deployment Guide**: [DEPLOYMENT-READY.md](DEPLOYMENT-READY.md)

---

**🎉 Ready for production deployment on Vercel!**