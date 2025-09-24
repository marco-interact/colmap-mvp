# Colmap App - 3D Reconstruction Platform

A modern Next.js 14 application for 3D reconstruction using COLMAP, built with TypeScript and TailwindCSS.

## 🚀 Features

- **Modern Tech Stack**: Next.js 14, TypeScript, TailwindCSS
- **3D Reconstruction**: COLMAP 3.12.6 integration for professional photogrammetry
- **Responsive Design**: Mobile-first design matching Colmap App brand
- **Real-time Processing**: Background job processing with status updates
- **Interactive 3D Viewer**: WebGL-based viewer with measurement tools
- **Project Management**: Comprehensive project and scan management
- **Authentication**: Secure JWT-based authentication system

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS + Custom CSS Variables
- **UI Components**: Custom component library
- **3D Rendering**: Three.js with React Three Fiber
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation

### Backend
- **API**: Next.js API Routes
- **Authentication**: JWT with HTTP-only cookies
- **Database**: Prisma ORM (ready for PostgreSQL/Supabase)
- **File Uploads**: Native Next.js file handling
- **Background Jobs**: Bull Queue (for COLMAP processing)

### COLMAP Integration
- **Processing Service**: Dockerized COLMAP 3.12.6 worker
- **Pipeline**: Feature extraction, matching, sparse & dense reconstruction
- **File Formats**: PLY, OBJ, GLTF support
- **Quality Settings**: Low, Medium, High, Extreme processing modes

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │────│   API Routes     │────│  COLMAP Worker  │
│   (Frontend)    │    │   (Backend)      │    │   (Docker)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
    ┌─────────┐            ┌─────────────┐         ┌─────────────┐
    │ Browser │            │  Database   │         │   Cloud     │
    │ Client  │            │ (Supabase)  │         │  Storage    │
    └─────────┘            └─────────────┘         └─────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Docker (for COLMAP worker)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/marco-interact/colmap-app.git
   cd colmap-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Login with: `test@domapping.com` / `password`

### Production Deployment

#### Deploy to Vercel

1. **Connect to GitHub**
   - Import project in Vercel dashboard
   - Connect to your GitHub repository

2. **Configure Environment Variables**
   ```bash
   COLMAP_WORKER_URL=https://your-colmap-worker.railway.app
   JWT_SECRET=your-production-jwt-secret
   DATABASE_URL=your-production-database-url
   ```

3. **Deploy**
   - Automatic deployment on push to `main`
   - Preview deployments for pull requests

#### Deploy COLMAP Worker

1. **Railway/Fly.io Deployment**
   ```bash
   cd colmap-worker
   docker build -t colmap-worker .
   # Deploy to your preferred container service
   ```

2. **Configure Worker URL**
   - Update `COLMAP_WORKER_URL` in Vercel environment variables

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── forms/            # Form components
│   └── ui/               # UI components
├── lib/                  # Utilities and configurations
├── types/                # TypeScript type definitions
└── hooks/                # Custom React hooks

colmap-worker/            # COLMAP processing service
├── Dockerfile           # Docker configuration
├── main.py             # FastAPI application
├── colmap_pipeline.py  # COLMAP processing logic
└── requirements.txt    # Python dependencies
```

## 🎨 Design System

### Colors
- **Primary**: `#4ECDC4` (Turquoise)
- **Background**: `#111111` (Dark)
- **Secondary**: `#1a1a1a` (Card backgrounds)
- **Text**: `#ffffff` (Primary), `#b3b3b3` (Secondary)

### Typography
- **Font**: Inter (Google Fonts)
- **Scale**: 0.875rem, 1rem, 1.125rem, 1.5rem, 2rem

### Components
- **Buttons**: Primary, Secondary, Ghost variants
- **Forms**: Custom inputs with focus states
- **Cards**: Hover effects and shadows
- **Modals**: Backdrop blur and animations

## 🔧 Configuration

### Environment Variables

```bash
# Required for production
COLMAP_WORKER_URL=https://your-worker-service.com
JWT_SECRET=your-jwt-secret

# Optional (for enhanced features)
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### COLMAP Processing

The application supports various COLMAP processing modes:

- **Low Quality**: Fast processing, lower detail
- **Medium Quality**: Balanced processing (default)
- **High Quality**: Detailed processing, longer time
- **Extreme Quality**: Maximum detail, very long processing

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests (when implemented)
npm run test
```

## 📦 Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **GitHub Issues**: [Create an issue](https://github.com/marco-interact/colmap-app/issues)
- **Email**: marco.aurelio@interact.studio
- **Documentation**: [Project Wiki](https://github.com/marco-interact/colmap-app/wiki)

## 🏗️ Roadmap

- [ ] **Database Integration**: Complete Prisma + Supabase setup
- [ ] **User Management**: Registration, profiles, team collaboration
- [ ] **File Storage**: Cloud storage integration
- [ ] **Real-time Updates**: WebSocket integration for processing status
- [ ] **3D Viewer**: Enhanced measurement and annotation tools
- [ ] **API Documentation**: OpenAPI/Swagger documentation
- [ ] **Mobile App**: React Native companion app
- [ ] **Enterprise Features**: SSO, advanced permissions, audit logs

---

Built with ❤️ by the Colmap App team using modern web technologies and COLMAP 3D reconstruction.
