#!/bin/bash

# Vercel Deployment Script
# For team: team_PWckdPO4Vl3C1PWOA9qs9DrI

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"

# Team ID
VERCEL_TEAM="team_PWckdPO4Vl3C1PWOA9qs9DrI"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed. Install it with: npm install -g vercel${NC}"
    exit 1
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel${NC}"
    echo -e "${BLUE}📝 Please run: vercel login${NC}"
    echo -e "${BLUE}📝 Then link to team: vercel link --scope ${VERCEL_TEAM}${NC}"
    exit 1
fi

# Link project to Vercel team (if not already linked)
if [ ! -f ".vercel/project.json" ]; then
    echo -e "${BLUE}📦 Linking project to Vercel team...${NC}"
    vercel link --scope "$VERCEL_TEAM" --yes
else
    echo -e "${GREEN}✅ Project already linked${NC}"
    # Verify team scope
    echo -e "${BLUE}📝 Current scope: $(vercel whoami)${NC}"
fi

# Deploy to production
echo -e "${BLUE}🚀 Deploying to production...${NC}"
vercel deploy --prod --scope "$VERCEL_TEAM"

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${BLUE}📝 To view logs and manage your deployment, visit: https://vercel.com${NC}"

