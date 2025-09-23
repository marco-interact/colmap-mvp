# 🚀 GitHub Repository Setup Guide

This guide will help you set up the 3D Visualization Platform on your GitHub account [@marco-interact](https://github.com/marco-interact).

## 📋 Prerequisites

- GitHub account: [@marco-interact](https://github.com/marco-interact)
- Git installed locally
- Docker and Docker Compose installed
- Node.js 18+ and Python 3.9+

## 🏗️ Repository Setup

### 1. Create Repository on GitHub

1. **Go to GitHub**: https://github.com/marco-interact
2. **Click "New Repository"**
3. **Repository Details**:
   - Name: `3d-visualization-platform`
   - Description: `A comprehensive 3D reconstruction platform using COLMAP and React`
   - Visibility: Public (or Private if preferred)
   - Initialize with README: ❌ (we have our own)

4. **Click "Create repository"**

### 2. Clone and Push Local Code

```bash
# Navigate to your project directory
cd "/Users/marco.aurelio/Desktop/Cursor Test"

# Initialize git repository
git init

# Add all files (respecting .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: 3D Visualization Platform with COLMAP integration

Features:
- React + TypeScript frontend with 3D viewer
- FastAPI backend with COLMAP pipeline
- 1GB file upload support
- Real-time processing with Celery
- Comprehensive staging environment
- Docker containerization
- CI/CD workflows"

# Add GitHub remote
git remote add origin https://github.com/marco-interact/colmap-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Replace README

```bash
# Replace the current README with GitHub-optimized version
mv README.md README-LOCAL.md
mv README-GITHUB.md README.md

# Commit the change
git add .
git commit -m "docs: Add comprehensive GitHub README with features, setup, and documentation"
git push
```

## ⚙️ GitHub Configuration

### 1. Repository Settings

**Go to**: `https://github.com/marco-interact/colmap-app/settings`

#### General Settings
- **Features**:
  - ✅ Wiki
  - ✅ Issues  
  - ✅ Discussions
  - ✅ Projects
- **Pull Requests**:
  - ✅ Allow squash merging
  - ✅ Allow auto-merge
  - ✅ Automatically delete head branches

#### Branch Protection Rules

**Go to**: Settings → Branches → Add rule

**Branch name pattern**: `main`

**Protection Rules**:
- ✅ Require a pull request before merging
  - ✅ Require approvals (1)
  - ✅ Dismiss stale PR approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Add status checks: `backend-test`, `frontend-test`, `security-scan`
- ✅ Require signed commits
- ✅ Include administrators

### 2. GitHub Actions Secrets

**Go to**: Settings → Secrets and variables → Actions

**Add Repository Secrets**:

```bash
# For Docker registry
REGISTRY_USERNAME=marco-interact
REGISTRY_PASSWORD=<your-github-token>

# For staging deployment (if using external staging)
STAGING_HOST=your-staging-server.com
STAGING_SSH_KEY=<your-ssh-private-key>

# For production deployment
PRODUCTION_HOST=your-production-server.com
PRODUCTION_SSH_KEY=<your-ssh-private-key>

# Optional: External API keys
SENTRY_DSN=<your-sentry-dsn>
MONITORING_API_KEY=<your-monitoring-key>
```

### 3. GitHub Pages (Optional)

If you want to host documentation:

**Go to**: Settings → Pages
- **Source**: Deploy from a branch
- **Branch**: `gh-pages` (create this branch for docs)

## 📦 Container Registry Setup

### 1. Enable GitHub Container Registry

**Go to**: Settings → Developer settings → Personal access tokens

**Create new token** with scopes:
- `read:packages`
- `write:packages` 
- `delete:packages`

### 2. Configure Docker Registry

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u marco-interact --password-stdin

# Test build and push
docker build -t ghcr.io/marco-interact/colmap-app-backend:test ./backend
docker push ghcr.io/marco-interact/colmap-app-backend:test
```

## 🚀 First Deployment

### 1. Test CI/CD Pipeline

```bash
# Create a test branch
git checkout -b test-ci-cd

# Make a small change
echo "# Test CI/CD" >> README.md

# Commit and push
git add .
git commit -m "test: Trigger CI/CD pipeline"
git push -u origin test-ci-cd
```

**Go to**: Actions tab on GitHub to watch the pipeline run

### 2. Create Pull Request

1. **Go to GitHub repository**
2. **Click "Compare & pull request"**
3. **Fill out PR template**
4. **Wait for CI checks**
5. **Merge when ready**

### 3. Create First Release

```bash
# Tag a release
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release v1.0.0: Initial 3D Visualization Platform

Features:
- Complete 3D reconstruction pipeline with COLMAP
- React frontend with Three.js 3D viewer
- 1GB file upload support
- Real-time processing monitoring
- Staging environment with Docker
- Comprehensive CI/CD pipeline"

# Push the tag
git push origin v1.0.0
```

This will trigger the release workflow and create:
- GitHub release with changelog
- Docker images in container registry
- Release assets (tar.gz, zip)

## 🔧 Local Development Workflow

### 1. Development Environment

```bash
# Clone your repository
git clone https://github.com/marco-interact/colmap-app.git
cd colmap-app

# Start development environment
docker-compose up -d

# Or use local development
./scripts/dev.sh
```

### 2. Making Changes

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes...
# Test locally...

# Commit with conventional commits
git commit -m "feat: add 3D model measurement tools

- Implement distance measurement in 3D viewer
- Add measurement history tracking
- Update UI with measurement controls"

# Push and create PR
git push -u origin feature/your-feature-name
```

### 3. Testing Changes

```bash
# Test locally
npm test           # Frontend tests
pytest            # Backend tests
docker-compose up # Integration testing

# Test staging deployment
./scripts/staging-deploy.sh
# Test your changes at http://localhost:8080
./scripts/staging-stop.sh
```

## 📊 Monitoring & Maintenance

### 1. GitHub Repository Health

**Monitor these areas**:
- **Actions**: CI/CD pipeline success rate
- **Issues**: Response time and resolution
- **Pull Requests**: Review turnaround time
- **Security**: Dependabot alerts and security advisories
- **Insights**: Traffic, clones, and contributor activity

### 2. Automated Maintenance

**Enable Dependabot**: Settings → Security & analysis

```yaml
# .github/dependabot.yml (already included)
version: 2
updates:
  - package-ecosystem: npm
    directory: /frontend
    schedule:
      interval: weekly
  - package-ecosystem: pip
    directory: /backend
    schedule:
      interval: weekly
  - package-ecosystem: docker
    directory: /
    schedule:
      interval: monthly
```

### 3. Community Management

**Set up community guidelines**:
- **Code of Conduct**: Use GitHub's template
- **Contributing Guidelines**: CONTRIBUTING.md
- **Security Policy**: SECURITY.md
- **Issue Templates**: Already configured
- **Discussions**: Enable for community Q&A

## 🎯 Next Steps

### Immediate Actions (Day 1)
- [ ] Create GitHub repository
- [ ] Push initial code
- [ ] Configure branch protection
- [ ] Set up secrets
- [ ] Test CI/CD pipeline
- [ ] Create first release

### Week 1
- [ ] Set up monitoring/alerting
- [ ] Configure external staging environment
- [ ] Create documentation site
- [ ] Set up project boards
- [ ] Enable discussions

### Month 1
- [ ] Gather user feedback
- [ ] Optimize CI/CD pipeline
- [ ] Set up production deployment
- [ ] Create user documentation
- [ ] Plan roadmap

## 🆘 Troubleshooting

### Common Issues

**CI/CD Pipeline Failures**:
```bash
# Check workflow logs on GitHub Actions tab
# Test locally first:
./scripts/staging-deploy.sh
```

**Docker Registry Issues**:
```bash
# Re-authenticate
echo $GITHUB_TOKEN | docker login ghcr.io -u marco-interact --password-stdin
```

**Branch Protection Issues**:
- Ensure status checks are properly configured
- Check that required checks match workflow job names

### Getting Help

1. **GitHub Documentation**: https://docs.github.com
2. **GitHub Community**: https://github.community
3. **Project Issues**: Create an issue for project-specific problems

---

## 🎉 You're Ready!

Your 3D Visualization Platform is now ready for collaborative development on GitHub with:

✅ **Professional repository structure**
✅ **Automated CI/CD pipeline** 
✅ **Container registry integration**
✅ **Comprehensive documentation**
✅ **Community-ready templates**
✅ **Security best practices**
✅ **Staging environment**

**Repository URL**: https://github.com/marco-interact/colmap-app

Start collaborating and building amazing 3D reconstruction experiences! 🚀
