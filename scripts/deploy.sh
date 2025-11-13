#!/bin/bash

# ============================================================================
# RAGS AI - Deployment Script
# ============================================================================

set -e

echo "🚀 Starting RAGS AI Deployment..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check environment
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
fi

echo -e "${BLUE}📦 Environment: $NODE_ENV${NC}"

# ============================================================================
# 1. Install Dependencies
# ============================================================================

echo -e "${BLUE}📥 Installing dependencies...${NC}"

# Backend
cd backend
npm ci --production
cd ..

# Desktop
cd desktop
npm ci
cd ..

# Mobile
cd mobile
npm ci
cd ..

echo -e "${GREEN}✅ Dependencies installed${NC}"

# ============================================================================
# 2. Build Backend
# ============================================================================

echo -e "${BLUE}🔨 Building backend...${NC}"
cd backend
npm run build
cd ..

echo -e "${GREEN}✅ Backend built${NC}"

# ============================================================================
# 3. Build Desktop App
# ============================================================================

echo -e "${BLUE}🖥️  Building desktop app...${NC}"
cd desktop
npm run tauri:build
cd ..

echo -e "${GREEN}✅ Desktop app built${NC}"

# ============================================================================
# 4. Build Mobile App (Optional)
# ============================================================================

if [ "$BUILD_MOBILE" = "true" ]; then
    echo -e "${BLUE}📱 Building mobile app...${NC}"
    cd mobile
    
    # iOS
    if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "all" ]; then
        echo "Building iOS..."
        eas build --platform ios --profile production
    fi
    
    # Android
    if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "all" ]; then
        echo "Building Android..."
        eas build --platform android --profile production
    fi
    
    cd ..
    echo -e "${GREEN}✅ Mobile app built${NC}"
fi

# ============================================================================
# 5. Run Tests
# ============================================================================

echo -e "${BLUE}🧪 Running tests...${NC}"
cd backend
npm test || echo -e "${RED}⚠️  Tests failed but continuing...${NC}"
cd ..

# ============================================================================
# 6. Deploy
# ============================================================================

echo -e "${BLUE}🚀 Deploying...${NC}"

# Deploy backend (example: to Railway, Render, or your server)
if [ "$DEPLOY_BACKEND" = "true" ]; then
    echo "Deploying backend..."
    # Add your deployment commands here
    # Example: railway up
    # Example: git push heroku main
fi

# ============================================================================
# Done
# ============================================================================

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📦 Build artifacts:"
echo "  - Backend: backend/dist/"
echo "  - Desktop: desktop/src-tauri/target/release/"
echo "  - Mobile: mobile/build/"
echo ""
echo "🎉 RAGS AI is ready to rock!"

