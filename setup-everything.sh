#!/bin/bash

# ============================================================================
# RAGS AI - Complete Setup Script
# Raghav Bhai, yeh script sab kuch install kar dega!
# ============================================================================

set -e  # Exit on error

echo "🚀 RAGS AI - Complete Setup Starting..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================================================
# STEP 1: Check Prerequisites
# ============================================================================

echo -e "${BLUE}📋 Step 1: Checking Prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found!${NC}"
    echo "Install from: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm: $(npm --version)${NC}"

# Check Homebrew
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}⚠️  Homebrew not found. Installing...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi
echo -e "${GREEN}✅ Homebrew installed${NC}"

echo ""

# ============================================================================
# STEP 2: Install Ollama
# ============================================================================

echo -e "${BLUE}📋 Step 2: Installing Ollama (AI Brain)...${NC}"

if ! command -v ollama &> /dev/null; then
    echo "Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    echo -e "${GREEN}✅ Ollama installed${NC}"
else
    echo -e "${GREEN}✅ Ollama already installed${NC}"
fi

# Start Ollama service
echo "Starting Ollama service..."
ollama serve > /dev/null 2>&1 &
sleep 3

# Download model
echo "Downloading Llama 3.2 model (this may take a few minutes)..."
ollama pull llama3.2

echo -e "${GREEN}✅ Ollama setup complete${NC}"
echo ""

# ============================================================================
# STEP 3: Install Rust (for Tauri)
# ============================================================================

echo -e "${BLUE}📋 Step 3: Installing Rust (for Desktop App)...${NC}"

if ! command -v cargo &> /dev/null; then
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
    echo -e "${GREEN}✅ Rust installed${NC}"
else
    echo -e "${GREEN}✅ Rust already installed: $(rustc --version)${NC}"
fi

echo ""

# ============================================================================
# STEP 4: Setup Backend
# ============================================================================

echo -e "${BLUE}📋 Step 4: Setting up Backend...${NC}"

cd backend

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Create .env if not exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env 2>/dev/null || cat > .env << EOF
PORT=3000
OLLAMA_URL=http://localhost:11434
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here
PICOVOICE_ACCESS_KEY=your_picovoice_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
GEMINI_API_KEY=your_gemini_key_here
EOF
fi

echo -e "${GREEN}✅ Backend setup complete${NC}"
cd ..
echo ""

# ============================================================================
# STEP 5: Setup Desktop App
# ============================================================================

echo -e "${BLUE}📋 Step 5: Setting up Desktop App...${NC}"

cd desktop

# Install dependencies
echo "Installing desktop dependencies..."
npm install

echo -e "${GREEN}✅ Desktop app setup complete${NC}"
cd ..
echo ""

# ============================================================================
# STEP 6: Setup Mobile App
# ============================================================================

echo -e "${BLUE}📋 Step 6: Setting up Mobile App...${NC}"

cd mobile

# Install dependencies
echo "Installing mobile dependencies..."
npm install

# Install EAS CLI globally
if ! command -v eas &> /dev/null; then
    echo "Installing EAS CLI..."
    npm install -g eas-cli
fi

echo -e "${GREEN}✅ Mobile app setup complete${NC}"
cd ..
echo ""

# ============================================================================
# STEP 7: Summary
# ============================================================================

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Ollama installed and running${NC}"
echo -e "${GREEN}✅ Rust installed${NC}"
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo -e "${GREEN}✅ Desktop app dependencies installed${NC}"
echo -e "${GREEN}✅ Mobile app dependencies installed${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📱 Next Steps:${NC}"
echo ""
echo "1. Start Backend:"
echo -e "   ${BLUE}cd backend && npm run dev${NC}"
echo ""
echo "2. Start Desktop App (Mac Window):"
echo -e "   ${BLUE}cd desktop && npm run tauri:dev${NC}"
echo ""
echo "3. Start Mobile App (iOS Simulator):"
echo -e "   ${BLUE}cd mobile && npm start${NC}"
echo -e "   ${YELLOW}Then press 'i' for iOS simulator${NC}"
echo ""
echo -e "${GREEN}🚀 Ready to launch!${NC}"
echo ""

