# 🚀 CI/CD Pipeline Setup Guide

**State-of-the-art CI/CD pipeline for COLMAP 3D Reconstruction Platform**

---

## 📋 Overview

This repository includes a comprehensive CI/CD pipeline with:

- ✅ **Automated Testing** (Backend & Frontend)
- ✅ **Security Scanning** (Dependencies, Docker, Code)
- ✅ **Code Quality Checks** (Linting, Formatting)
- ✅ **Automated Deployment** (Northflank)
- ✅ **Dependency Updates** (Dependabot)
- ✅ **Issue & PR Templates**

---

## 🔧 Required GitHub Secrets

Add these secrets to your GitHub repository (`Settings` → `Secrets and variables` → `Actions`):

### **Northflank Configuration**
```
NORTHFLANK_API_KEY=your_northflank_api_key
NORTHFLANK_PROJECT_ID=your_project_id
NORTHFLANK_BACKEND_SERVICE_ID=your_backend_service_id
NORTHFLANK_FRONTEND_SERVICE_ID=your_frontend_service_id
```

### **Service URLs**
```
BACKEND_URL=https://your-backend-service.northflank.app
FRONTEND_URL=https://site--colmap-frontend--xf7lzhrl47hj.code.run
```

### **Optional: Code Quality**
```
CODECOV_TOKEN=your_codecov_token
```

---

## 🚀 Workflow Overview

### **1. CI/CD Pipeline (`ci-cd.yml`)**
**Triggers:** Push to `main`, PRs, Manual dispatch

**Jobs:**
- 🔍 **Code Quality & Security** - Linting, formatting, security scans
- 🧪 **Backend Testing** - Python tests with coverage
- 🎨 **Frontend Testing** - Node.js tests, linting, build
- 🐳 **Docker Build** - Container image creation
- 🚀 **Deploy Backend** - Deploy to Northflank
- 🚀 **Deploy Frontend** - Deploy to Northflank
- 📊 **Deployment Summary** - Status report

### **2. Security Pipeline (`security.yml`)**
**Triggers:** Weekly schedule, Push to `main`, PRs

**Jobs:**
- 🔒 **Security Scan** - Bandit, Safety, Pip-audit
- 📦 **Dependency Scan** - NPM audit
- 🐳 **Docker Security** - Trivy container scanning

### **3. Testing Pipeline (`test.yml`)**
**Triggers:** Push to `main`/`develop`, PRs, Manual dispatch

**Jobs:**
- 🐍 **Backend Tests** - Multi-version Python testing
- ⚛️ **Frontend Tests** - Multi-version Node.js testing
- 🔗 **Integration Tests** - End-to-end testing
- ⚡ **Performance Tests** - Load testing

### **4. Deployment Pipeline (`deploy.yml`)**
**Triggers:** Push to `main`, Manual dispatch

**Jobs:**
- 🐍 **Deploy Backend** - Docker build & deploy
- ⚛️ **Deploy Frontend** - Node.js build & deploy
- 📊 **Deployment Summary** - Final status report

---

## 🎯 Quick Start

### **1. Enable Workflows**
1. Go to your GitHub repository
2. Navigate to `Actions` tab
3. Enable all workflows

### **2. Add Secrets**
1. Go to `Settings` → `Secrets and variables` → `Actions`
2. Add all required secrets (see above)

### **3. Test the Pipeline**
```bash
# Create a test branch
git checkout -b test-ci-cd

# Make a small change
echo "# Test CI/CD" >> README.md

# Commit and push
git add README.md
git commit -m "test: trigger CI/CD pipeline"
git push origin test-ci-cd

# Create a PR to main
# This will trigger the full pipeline
```

---

## 📊 Pipeline Features

### **🔍 Code Quality**
- **Python**: Black formatting, Flake8 linting, Bandit security
- **Node.js**: ESLint, Prettier, TypeScript checks
- **Security**: Dependency vulnerability scanning
- **Coverage**: Code coverage reporting with Codecov

### **🧪 Testing**
- **Multi-version**: Python 3.12/3.13, Node.js 18/20
- **Integration**: End-to-end API testing
- **Performance**: Load testing with curl
- **Coverage**: Detailed coverage reports

### **🐳 Docker**
- **Multi-platform**: Build for different architectures
- **Security**: Trivy vulnerability scanning
- **Caching**: GitHub Actions cache for faster builds
- **Registry**: Automatic push to GitHub Container Registry

### **🚀 Deployment**
- **Automated**: Deploy on push to main
- **Health Checks**: Verify deployment success
- **Rollback**: Easy rollback on failure
- **Monitoring**: Deployment status reporting

---

## 🔄 Workflow Triggers

### **Automatic Triggers**
- **Push to `main`**: Full CI/CD + Deployment
- **Push to `develop`**: CI/CD without deployment
- **Pull Requests**: CI/CD + Security checks
- **Weekly**: Security scanning

### **Manual Triggers**
- **Workflow Dispatch**: Manual deployment
- **Environment Selection**: Production vs Staging

---

## 📈 Monitoring & Alerts

### **GitHub Actions**
- **Status Badges**: Add to README
- **Notifications**: Email on failure
- **Logs**: Detailed execution logs

### **Code Quality**
- **Codecov**: Coverage tracking
- **Security**: Vulnerability alerts
- **Dependencies**: Outdated package alerts

### **Deployment**
- **Health Checks**: Automatic verification
- **Status Reports**: Deployment summaries
- **Rollback**: Easy failure recovery

---

## 🛠️ Customization

### **Environment Variables**
```yaml
# In workflow files
env:
  NODE_VERSION: '18'
  PYTHON_VERSION: '3.13'
  REGISTRY: ghcr.io
```

### **Matrix Testing**
```yaml
# Test multiple versions
strategy:
  matrix:
    python-version: ['3.12', '3.13']
    node-version: ['18', '20']
```

### **Conditional Deployment**
```yaml
# Deploy only on main branch
if: github.ref == 'refs/heads/main'
```

---

## 🐛 Troubleshooting

### **Common Issues**

**1. Secrets Not Found**
```
Error: Secret NORTHFLANK_API_KEY not found
```
**Solution:** Add secrets in GitHub repository settings

**2. Docker Build Fails**
```
Error: Docker build failed
```
**Solution:** Check Dockerfile syntax, test locally first

**3. Deployment Timeout**
```
Error: Health check failed
```
**Solution:** Increase timeout, check service URLs

**4. Test Failures**
```
Error: Tests failed
```
**Solution:** Run tests locally, check test configuration

### **Debug Commands**
```bash
# Test locally
docker build -t colmap-test .
docker run -p 8000:8000 colmap-test

# Check logs
gh run list
gh run view [run-id]
```

---

## 📚 Documentation

### **Workflow Files**
- `ci-cd.yml` - Main CI/CD pipeline
- `security.yml` - Security scanning
- `test.yml` - Testing pipeline
- `deploy.yml` - Deployment pipeline

### **Templates**
- `ISSUE_TEMPLATE/` - Bug reports & feature requests
- `PULL_REQUEST_TEMPLATE.md` - PR template
- `dependabot.yml` - Dependency updates

### **Configuration**
- `.github/workflows/` - All workflow files
- `.github/dependabot.yml` - Automated updates
- `CI_CD_SETUP.md` - This guide

---

## 🎯 Next Steps

1. **Add Secrets** - Configure all required secrets
2. **Test Pipeline** - Create a test PR
3. **Monitor Deployments** - Check deployment status
4. **Customize** - Adjust workflows for your needs
5. **Scale** - Add more environments as needed

---

## 🚀 Benefits

- ✅ **Automated Testing** - Catch bugs early
- ✅ **Security Scanning** - Prevent vulnerabilities
- ✅ **Quality Gates** - Maintain code standards
- ✅ **Automated Deployment** - Reduce manual work
- ✅ **Monitoring** - Track deployment health
- ✅ **Rollback** - Quick failure recovery

---

**Status:** Ready for production! 🚀

**Last Updated:** October 22, 2025
**Repository:** https://github.com/marco-interact/colmap-mvp
