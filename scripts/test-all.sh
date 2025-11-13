#!/bin/bash

# ============================================================================
# RAGS AI - Comprehensive Test Script
# ============================================================================

set -e

echo "🧪 RAGS AI - Running Comprehensive Tests"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Function to print test result
test_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASSED${NC}: $2"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAILED${NC}: $2"
    ((FAILED++))
  fi
}

echo "📦 1. Checking Dependencies..."
echo "--------------------------------"

# Check Node.js
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  test_result 0 "Node.js installed ($NODE_VERSION)"
else
  test_result 1 "Node.js not found"
fi

# Check npm
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  test_result 0 "npm installed ($NPM_VERSION)"
else
  test_result 1 "npm not found"
fi

# Check Rust (for Tauri)
if command -v rustc &> /dev/null; then
  RUST_VERSION=$(rustc --version)
  test_result 0 "Rust installed ($RUST_VERSION)"
else
  test_result 1 "Rust not found (needed for Tauri)"
fi

echo ""
echo "🔍 2. Checking Project Structure..."
echo "------------------------------------"

# Check directories
[ -d "backend" ] && test_result 0 "backend/ directory exists" || test_result 1 "backend/ directory missing"
[ -d "mobile" ] && test_result 0 "mobile/ directory exists" || test_result 1 "mobile/ directory missing"
[ -d "desktop" ] && test_result 0 "desktop/ directory exists" || test_result 1 "desktop/ directory missing"

# Check key files
[ -f "backend/package.json" ] && test_result 0 "backend/package.json exists" || test_result 1 "backend/package.json missing"
[ -f "mobile/package.json" ] && test_result 0 "mobile/package.json exists" || test_result 1 "mobile/package.json missing"
[ -f "desktop/package.json" ] && test_result 0 "desktop/package.json exists" || test_result 1 "desktop/package.json missing"
[ -f "backend/.env" ] && test_result 0 "backend/.env exists" || test_result 1 "backend/.env missing"

echo ""
echo "📚 3. Checking Backend Services..."
echo "-----------------------------------"

# Check backend service files
BACKEND_SERVICES=(
  "backend/src/services/voice-pipeline.ts"
  "backend/src/services/ollama-brain.ts"
  "backend/src/services/memory-system.ts"
  "backend/src/services/agent-engine.ts"
  "backend/src/services/master-orchestrator.ts"
)

for service in "${BACKEND_SERVICES[@]}"; do
  if [ -f "$service" ]; then
    test_result 0 "$(basename $service) exists"
  else
    test_result 1 "$(basename $service) missing"
  fi
done

echo ""
echo "🎨 4. Checking UI Components..."
echo "--------------------------------"

# Check desktop components
DESKTOP_COMPONENTS=(
  "desktop/src/App.tsx"
  "desktop/src/components/AIOrb.tsx"
  "desktop/src/components/VoiceVisualizer.tsx"
  "desktop/src/components/ChatPanel.tsx"
)

for component in "${DESKTOP_COMPONENTS[@]}"; do
  if [ -f "$component" ]; then
    test_result 0 "$(basename $component) exists"
  else
    test_result 1 "$(basename $component) missing"
  fi
done

echo ""
echo "📱 5. Checking Mobile App..."
echo "-----------------------------"

[ -f "mobile/App.tsx" ] && test_result 0 "Mobile App.tsx exists" || test_result 1 "Mobile App.tsx missing"
[ -d "mobile/assets" ] && test_result 0 "Mobile assets/ exists" || test_result 1 "Mobile assets/ missing"

echo ""
echo "🔌 6. Testing Backend API..."
echo "-----------------------------"

# Start backend in background
echo "Starting backend server..."
cd backend
npm run dev > /dev/null 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for server to start
sleep 5

# Test health endpoint
if curl -s http://localhost:3000/health > /dev/null; then
  test_result 0 "Backend health endpoint responding"
else
  test_result 1 "Backend health endpoint not responding"
fi

# Kill backend
kill $BACKEND_PID 2>/dev/null || true

echo ""
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some tests failed. Please review above.${NC}"
  exit 1
fi

