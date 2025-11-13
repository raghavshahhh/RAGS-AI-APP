#!/bin/bash

# 🧪 RAGS System Test Script

clear
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 RAGS AI - System Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Ollama
echo -n "1. Testing Ollama... "
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    echo "   Models: $MODELS"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Run: ollama serve"
fi

# Test 2: Whisper
echo -n "2. Testing Whisper... "
if command -v whisper &> /dev/null; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "   Path: $(which whisper)"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Install from whisper.cpp"
fi

# Test 3: Backend
echo -n "3. Testing Backend... "
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    UPTIME=$(curl -s http://localhost:3000/health | grep -o '"uptime":[0-9.]*' | cut -d':' -f2)
    echo "   Uptime: ${UPTIME}s"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Run: cd backend && npm run dev"
fi

# Test 4: Storage
echo -n "4. Testing Storage... "
if [ -d ~/.rags/storage ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    SIZE=$(du -sh ~/.rags/storage 2>/dev/null | cut -f1)
    echo "   Size: $SIZE"
else
    echo -e "${YELLOW}⚠ Creating...${NC}"
    mkdir -p ~/.rags/storage
    echo -e "${GREEN}✓ PASS${NC}"
fi

# Test 5: Node.js
echo -n "5. Testing Node.js... "
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "   Version: $(node -v)"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Install: brew install node"
fi

# Test 6: Environment
echo -n "6. Testing .env... "
if [ -f backend/.env ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    if grep -q "your_picovoice_key_here" backend/.env; then
        echo -e "   ${YELLOW}⚠ Add Picovoice key${NC}"
    fi
    if grep -q "your_gemini_key_here" backend/.env; then
        echo -e "   ${YELLOW}⚠ Add Gemini key (optional)${NC}"
    fi
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Run: cp backend/.env.example backend/.env"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
