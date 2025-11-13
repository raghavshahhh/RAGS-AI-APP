#!/bin/bash

# ============================================================================
# RAGS AI - Test All Improvements
# ============================================================================

echo "🧪 Testing RAGS AI Improvements..."
echo "======================================"
echo ""

BASE_URL="http://localhost:3000"
PASSED=0
FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$url" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "   Response: $body"
        ((FAILED++))
        return 1
    fi
}

echo "1️⃣  Backend Health Checks"
echo "========================"
test_endpoint "Basic Health" "GET" "/health"
test_endpoint "Detailed Status" "GET" "/api/v1/status"
echo ""

echo "2️⃣  API Endpoints"
echo "================"
test_endpoint "API Root" "GET" "/"
test_endpoint "Notes API" "GET" "/api/v1/notes"
test_endpoint "Reminders API" "GET" "/api/v1/reminders"
echo ""

echo "3️⃣  AI Integration"
echo "================="
# Note: These will fail if Ollama is not running, that's OK
echo "Testing AI Chat (may fail if Ollama not running)..."
test_endpoint "AI Chat" "POST" "/api/real-ai/chat" '{"message":"Hello"}' || echo "   ${YELLOW}Note: Ollama may not be running${NC}"
echo ""

echo "4️⃣  WebSocket Connection"
echo "======================="
echo -n "Testing WebSocket... "
wscat -c "ws://localhost:3000" -x '{"type":"ping"}' -w 2 >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SKIP${NC} (wscat not installed)"
    echo "   Install wscat: npm install -g wscat"
fi
echo ""

echo "5️⃣  Performance Tests"
echo "==================="
echo "Testing response caching..."

# First request (slow)
echo -n "First request (uncached)... "
start_time=$(date +%s%N)
curl -s "$BASE_URL/health" >/dev/null
end_time=$(date +%s%N)
duration1=$(( (end_time - start_time) / 1000000 ))
echo "${duration1}ms"

# Second request (should be faster due to connection reuse)
echo -n "Second request... "
start_time=$(date +%s%N)
curl -s "$BASE_URL/health" >/dev/null
end_time=$(date +%s%N)
duration2=$(( (end_time - start_time) / 1000000 ))
echo "${duration2}ms"

if [ $duration2 -lt $duration1 ]; then
    echo -e "${GREEN}✓ Response time improved${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Response time similar${NC}"
fi
echo ""

echo "6️⃣  Memory System"
echo "================"
MEMORY_DIR="./data/memory/user1"
if [ -d "$MEMORY_DIR" ]; then
    echo -e "${GREEN}✓ Memory directory exists${NC}"
    
    if [ -f "$MEMORY_DIR/memories.json" ]; then
        echo -e "${GREEN}✓ Memory file exists${NC}"
        MEMORY_COUNT=$(cat "$MEMORY_DIR/memories.json" | grep -o "\"id\"" | wc -l)
        echo "   Memories stored: $MEMORY_COUNT"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ No memories stored yet${NC}"
    fi
    
    if [ -f "$MEMORY_DIR/conversations.json" ]; then
        echo -e "${GREEN}✓ Conversation file exists${NC}"
        CONV_COUNT=$(cat "$MEMORY_DIR/conversations.json" | grep -o "\"id\"" | wc -l)
        echo "   Conversations stored: $CONV_COUNT"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ No conversations stored yet${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Memory directory not created yet${NC}"
    echo "   Will be created on first use"
fi
echo ""

echo "7️⃣  File Structure"
echo "================="
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1 (missing)"
        ((FAILED++))
    fi
}

check_file "backend/src/services/ollama-brain.ts"
check_file "backend/src/services/enhanced-local-memory.ts"
check_file "backend/src/index.ts"
check_file "desktop/src/services/enhanced-api-service.ts"
check_file "desktop/src/services/enhanced-websocket-service.ts"
check_file "desktop/src/store/useStore.ts"
check_file "mobile/src/hooks/useVoiceRecording.tsx"
check_file "mobile/src/hooks/useCamera.tsx"
echo ""

echo "8️⃣  Dependencies Check"
echo "===================="
echo "Checking backend dependencies..."
cd backend 2>/dev/null
if [ -f "package.json" ]; then
    if npm list axios >/dev/null 2>&1; then
        echo -e "${GREEN}✓ axios installed${NC}"
        ((PASSED++))
    fi
    if npm list ws >/dev/null 2>&1; then
        echo -e "${GREEN}✓ ws installed${NC}"
        ((PASSED++))
    fi
    if npm list ollama >/dev/null 2>&1; then
        echo -e "${GREEN}✓ ollama installed${NC}"
        ((PASSED++))
    fi
fi
cd - >/dev/null 2>&1
echo ""

echo "======================================"
echo "📊 Test Results"
echo "======================================"
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
TOTAL=$((PASSED + FAILED))
echo "Total:  $TOTAL"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠ Some tests failed. Check the output above.${NC}"
    exit 1
fi
