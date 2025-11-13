#!/bin/bash

echo "🚀 Starting RAGS AI System..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "desktop" ] || [ ! -d "backend" ]; then
    echo -e "${RED}❌ Error: Please run this script from RAGS.V1 directory${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Checking dependencies...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm found: $(npm --version)${NC}"

echo ""
echo -e "${BLUE}🎯 Starting RAGS Desktop App...${NC}"
echo ""

# Go to desktop directory
cd desktop

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing desktop dependencies...${NC}"
    npm install
fi

# Start desktop app
echo -e "${GREEN}🚀 Launching RAGS Desktop...${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   RAGS AI Desktop App Starting...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📱 App will open in your browser${NC}"
echo -e "${BLUE}🎤 Click mic button to start voice${NC}"
echo -e "${BLUE}💬 Say 'Hello' to test RAGS${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

npm run dev
