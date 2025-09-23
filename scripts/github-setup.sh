#!/bin/bash

# GitHub Setup Script for 3D Visualization Platform
# Helps prepare the repository for GitHub deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

REPO_NAME="colmap-app"
GITHUB_USER="marco-interact"
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo -e "${BLUE}🚀 GitHub Setup for 3D Visualization Platform${NC}\n"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
    
    if ! command_exists git; then
        echo -e "${RED}❌ Git is not installed!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Git is installed${NC}"
    
    if ! command_exists docker; then
        echo -e "${RED}❌ Docker is not installed!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is installed${NC}"
    
    if ! command_exists node; then
        echo -e "${RED}❌ Node.js is not installed!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js is installed${NC}"
    
    if ! command_exists python3; then
        echo -e "${RED}❌ Python 3 is not installed!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Python 3 is installed${NC}"
}

# Initialize git repository
init_git_repo() {
    echo -e "\n${YELLOW}📁 Initializing Git repository...${NC}"
    
    if [ -d ".git" ]; then
        echo -e "${GREEN}✅ Git repository already exists${NC}"
    else
        git init
        echo -e "${GREEN}✅ Git repository initialized${NC}"
    fi
}

# Setup git configuration
setup_git_config() {
    echo -e "\n${YELLOW}⚙️ Setting up Git configuration...${NC}"
    
    # Check if user has git configured
    if ! git config user.name >/dev/null 2>&1; then
        echo -e "${BLUE}Please enter your name for Git commits:${NC}"
        read -r git_name
        git config user.name "$git_name"
    fi
    
    if ! git config user.email >/dev/null 2>&1; then
        echo -e "${BLUE}Please enter your email for Git commits:${NC}"
        read -r git_email
        git config user.email "$git_email"
    fi
    
    echo -e "${GREEN}✅ Git configuration set${NC}"
}

# Create GitHub-optimized README
setup_readme() {
    echo -e "\n${YELLOW}📚 Setting up GitHub README...${NC}"
    
    if [ -f "README.md" ]; then
        mv README.md README-LOCAL.md
        echo -e "${BLUE}ℹ️ Moved original README to README-LOCAL.md${NC}"
    fi
    
    if [ -f "README-GITHUB.md" ]; then
        mv README-GITHUB.md README.md
        echo -e "${GREEN}✅ GitHub README activated${NC}"
    else
        echo -e "${YELLOW}⚠️ README-GITHUB.md not found${NC}"
    fi
}

# Add all files and create initial commit
create_initial_commit() {
    echo -e "\n${YELLOW}💾 Creating initial commit...${NC}"
    
    # Add all files (respecting .gitignore)
    git add .
    
    # Check if there are changes to commit
    if git diff --cached --quiet; then
        echo -e "${YELLOW}ℹ️ No changes to commit${NC}"
        return
    fi
    
    # Create detailed initial commit
    git commit -m "Initial commit: 3D Visualization Platform with COLMAP integration

Features:
- React + TypeScript frontend with 3D viewer and measurement tools
- FastAPI backend with comprehensive COLMAP pipeline integration
- Support for 1GB video file uploads with progress tracking
- Real-time processing monitoring with Celery workers
- Production-ready staging environment with Docker
- Complete CI/CD workflows with GitHub Actions
- Automated testing and security scanning
- Comprehensive documentation and setup guides

Technical Stack:
- Frontend: React 18, Three.js, TypeScript, Material-UI
- Backend: FastAPI, Python 3.9, COLMAP, PostgreSQL, Redis
- Infrastructure: Docker, Nginx, Celery, GitHub Actions
- Monitoring: Health checks, logging, metrics

Ready for collaborative development and deployment."
    
    echo -e "${GREEN}✅ Initial commit created${NC}"
}

# Setup GitHub remote
setup_github_remote() {
    echo -e "\n${YELLOW}🔗 Setting up GitHub remote...${NC}"
    
    # Check if remote already exists
    if git remote get-url origin >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Remote 'origin' already configured${NC}"
        current_url=$(git remote get-url origin)
        echo -e "${BLUE}Current remote: ${current_url}${NC}"
        
        if [[ "$current_url" != "$REPO_URL" ]]; then
            echo -e "${YELLOW}⚠️ Remote URL doesn't match expected GitHub URL${NC}"
            echo -e "${BLUE}Expected: ${REPO_URL}${NC}"
            read -p "Update remote URL? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git remote set-url origin "$REPO_URL"
                echo -e "${GREEN}✅ Remote URL updated${NC}"
            fi
        fi
    else
        git remote add origin "$REPO_URL"
        echo -e "${GREEN}✅ GitHub remote added${NC}"
    fi
}

# Push to GitHub
push_to_github() {
    echo -e "\n${YELLOW}🚀 Pushing to GitHub...${NC}"
    
    # Set main as default branch
    git branch -M main
    
    # Push to GitHub
    echo -e "${BLUE}Pushing to GitHub repository...${NC}"
    if git push -u origin main; then
        echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
    else
        echo -e "${RED}❌ Failed to push to GitHub${NC}"
        echo -e "${YELLOW}Make sure you have:${NC}"
        echo -e "1. Created the repository on GitHub"
        echo -e "2. Have proper authentication (SSH key or token)"
        echo -e "3. Have write permissions to the repository"
        return 1
    fi
}

# Show next steps
show_next_steps() {
    echo -e "\n${GREEN}🎉 GitHub setup completed successfully!${NC}\n"
    
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo -e "1. ${YELLOW}Visit your repository:${NC} https://github.com/${GITHUB_USER}/${REPO_NAME}"
    echo -e "2. ${YELLOW}Configure branch protection:${NC} Settings → Branches"
    echo -e "3. ${YELLOW}Set up secrets:${NC} Settings → Secrets and variables"
    echo -e "4. ${YELLOW}Enable discussions:${NC} Settings → Features"
    echo -e "5. ${YELLOW}Test CI/CD:${NC} Create a pull request"
    
    echo -e "\n${BLUE}🔧 Repository Features:${NC}"
    echo -e "- ✅ Complete CI/CD pipeline with GitHub Actions"
    echo -e "- ✅ Automated testing and security scanning"
    echo -e "- ✅ Docker container registry integration"
    echo -e "- ✅ Staging environment setup"
    echo -e "- ✅ Issue and PR templates"
    echo -e "- ✅ Comprehensive documentation"
    
    echo -e "\n${BLUE}📚 Documentation:${NC}"
    echo -e "- ${YELLOW}Setup Guide:${NC} GITHUB-SETUP.md"
    echo -e "- ${YELLOW}Staging Guide:${NC} STAGING.md"
    echo -e "- ${YELLOW}Local Development:${NC} README-LOCAL.md"
    
    echo -e "\n${GREEN}🚀 Ready for collaborative development!${NC}"
}

# Main execution
main() {
    echo -e "This script will prepare your 3D Visualization Platform for GitHub.\n"
    
    check_prerequisites
    init_git_repo
    setup_git_config
    setup_readme
    create_initial_commit
    setup_github_remote
    
    echo -e "\n${YELLOW}Ready to push to GitHub?${NC}"
    read -p "Push to https://github.com/${GITHUB_USER}/${REPO_NAME}? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if push_to_github; then
            show_next_steps
        else
            echo -e "\n${YELLOW}💡 Manual push instructions:${NC}"
            echo -e "1. Create repository on GitHub: https://github.com/new"
            echo -e "2. Repository name: ${REPO_NAME}"
            echo -e "3. Run: ${BLUE}git push -u origin main${NC}"
        fi
    else
        echo -e "\n${YELLOW}Setup completed locally. To push later:${NC}"
        echo -e "${BLUE}git push -u origin main${NC}"
    fi
}

# Handle script arguments
case "${1:-}" in
    --help)
        echo "Usage: $0 [--help]"
        echo "  --help : Show this help message"
        echo ""
        echo "This script prepares the 3D Visualization Platform for GitHub deployment."
        echo "It will:"
        echo "- Initialize Git repository"
        echo "- Set up Git configuration"
        echo "- Create optimized README for GitHub"
        echo "- Create initial commit with detailed message"
        echo "- Configure GitHub remote"
        echo "- Optionally push to GitHub"
        exit 0
        ;;
    *)
        main
        ;;
esac
