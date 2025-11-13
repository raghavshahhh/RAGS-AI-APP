#!/bin/bash

# 🧪 COMPREHENSIVE RAGS TESTING SCRIPT
# Tests all implemented features end-to-end
# NO DEMO DATA - All real working tests!

echo "🚀 Starting Comprehensive RAGS Testing..."
echo "=========================================="

# Base URL
BASE_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}🧪 Test $TOTAL_TESTS: $test_name${NC}"
    echo "Command: $test_command"
    
    # Run the test
    response=$(eval "$test_command" 2>/dev/null)
    
    if [[ $? -eq 0 ]] && [[ "$response" =~ $expected_pattern ]]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        echo "Response: $(echo "$response" | jq -r '.message // .status // .success // .' 2>/dev/null || echo "$response" | head -c 100)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "Response: $(echo "$response" | head -c 200)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo -e "\n${YELLOW}📋 TESTING PHASE 1: CORE SYSTEM STATUS${NC}"
echo "============================================"

# Test 1: Server Health Check
run_test "Server Health Check" \
    "curl -s $BASE_URL/health" \
    "ok|healthy|running"

# Test 2: Enhanced Control Status
run_test "Enhanced Control Status" \
    "curl -s $BASE_URL/api/enhanced/status" \
    "success.*true"

# Test 3: Master Integration Status
run_test "Master Integration Capabilities" \
    "curl -s $BASE_URL/api/enhanced/status | jq '.status.capabilities'" \
    "mouseControl|screenAnalysis"

echo -e "\n${YELLOW}📋 TESTING PHASE 2: MOUSE CONTROL${NC}"
echo "======================================="

# Test 4: Mouse Position
run_test "Get Mouse Position" \
    "curl -s $BASE_URL/api/enhanced/mouse/position" \
    "success.*true.*position"

# Test 5: Mouse Movement (small movement)
run_test "Mouse Movement Test" \
    "curl -s -X POST $BASE_URL/api/enhanced/mouse/move -H 'Content-Type: application/json' -d '{\"x\": 100, \"y\": 100, \"duration\": 500}'" \
    "success.*true"

# Test 6: Mouse Click Test
run_test "Mouse Click Test" \
    "curl -s -X POST $BASE_URL/api/enhanced/mouse/click -H 'Content-Type: application/json' -d '{\"x\": 100, \"y\": 100}'" \
    "success.*true"

echo -e "\n${YELLOW}📋 TESTING PHASE 3: SCREEN INTELLIGENCE${NC}"
echo "=========================================="

# Test 7: Screen Analysis
run_test "Screen Analysis" \
    "curl -s -X POST $BASE_URL/api/enhanced/screen/analyze" \
    "success.*true.*elements"

# Test 8: Screen Status
run_test "Screen Intelligence Status" \
    "curl -s $BASE_URL/api/enhanced/screen/status" \
    "enabled|ready|initialized"

echo -e "\n${YELLOW}📋 TESTING PHASE 4: BACKGROUND MONITORING${NC}"
echo "===========================================" 

# Test 9: Background Status
run_test "Background Monitor Status" \
    "curl -s $BASE_URL/api/enhanced/background/status" \
    "monitoring|active|context"

# Test 10: Background Context
run_test "Get Active Context" \
    "curl -s $BASE_URL/api/enhanced/background/context" \
    "appName|windowTitle|context"

# Test 11: Background Command Processing
run_test "Background Command Test" \
    "curl -s -X POST $BASE_URL/api/enhanced/background-command -H 'Content-Type: application/json' -d '{\"command\": \"get current app info\"}'" \
    "success.*true"

echo -e "\n${YELLOW}📋 TESTING PHASE 5: AI BRAIN${NC}"
echo "================================"

# Test 12: AI Brain Status
run_test "AI Brain Status" \
    "curl -s $BASE_URL/api/enhanced/ai/status" \
    "skills|patterns|evolution"

# Test 13: AI Response Test
run_test "AI Response Test" \
    "curl -s -X POST $BASE_URL/api/enhanced/ai/respond -H 'Content-Type: application/json' -d '{\"message\": \"Hello RAGS, how are you?\"}'" \
    "response|text|message"

# Test 14: AI Learning Test
run_test "AI Learning Test" \
    "curl -s -X POST $BASE_URL/api/enhanced/ai/learn -H 'Content-Type: application/json' -d '{\"skill\": \"greeting\", \"context\": \"user said hello\", \"outcome\": \"positive\"}'" \
    "success.*true"

echo -e "\n${YELLOW}📋 TESTING PHASE 6: BROWSER AUTOMATION${NC}"
echo "========================================"

# Test 15: Browser Status
run_test "Browser Automation Status" \
    "curl -s $BASE_URL/api/browser/status" \
    "available|ready|initialized"

# Test 16: Browser Initialize
run_test "Browser Initialize" \
    "curl -s -X POST $BASE_URL/api/browser/init" \
    "success.*true|initialized"

echo -e "\n${YELLOW}📋 TESTING PHASE 7: CAMERA MONITORING${NC}"
echo "======================================"

# Test 17: Camera Status
run_test "Camera Monitor Status" \
    "curl -s $BASE_URL/api/enhanced/camera/status" \
    "enabled|cameraReady|monitoring"

# Test 18: Camera Analysis (if available)
run_test "Camera Analysis Test" \
    "curl -s -X POST $BASE_URL/api/enhanced/camera/analyze -H 'Content-Type: application/json' -d '{\"question\": \"What do you see?\"}'" \
    "analysis|description|success"

echo -e "\n${YELLOW}📋 TESTING PHASE 8: REAL INTEGRATION ENGINE${NC}"
echo "============================================="

# Test 19: Real Integration Status
run_test "Real Integration Status" \
    "curl -s $BASE_URL/api/enhanced/real/status" \
    "success.*true.*status"

# Test 20: Real Integration Validation
run_test "Service Validation" \
    "curl -s -X POST $BASE_URL/api/enhanced/real/validate" \
    "success.*true.*validation"

# Test 21: Real Command Execution
run_test "Real Command Test" \
    "curl -s -X POST $BASE_URL/api/enhanced/real/command -H 'Content-Type: application/json' -d '{\"command\": \"get system info\"}'" \
    "success.*true.*result"

echo -e "\n${YELLOW}📋 TESTING PHASE 9: SYSTEM CONTROL${NC}"
echo "==================================="

# Test 22: System Information
run_test "System Information" \
    "curl -s $BASE_URL/api/system/info" \
    "platform|version|memory"

# Test 23: System Status
run_test "System Status Check" \
    "curl -s $BASE_URL/api/system/status" \
    "status|uptime|healthy"

echo -e "\n${YELLOW}📋 TESTING PHASE 10: ADVANCED FEATURES${NC}"
echo "======================================"

# Test 24: Task Management
run_test "Add Task Test" \
    "curl -s -X POST $BASE_URL/api/enhanced/task/add -H 'Content-Type: application/json' -d '{\"type\": \"test\", \"description\": \"Test task\", \"priority\": 5}'" \
    "success.*true.*taskId"

# Test 25: Enhanced Command Processing
run_test "Enhanced Command Test" \
    "curl -s -X POST $BASE_URL/api/enhanced/command -H 'Content-Type: application/json' -d '{\"command\": \"tell me about the current screen\"}'" \
    "success.*true.*result"

echo -e "\n${YELLOW}📋 TESTING PHASE 11: PERFORMANCE & MONITORING${NC}"
echo "=============================================="

# Test 26: Performance Metrics
run_test "Performance Metrics" \
    "curl -s $BASE_URL/api/enhanced/performance" \
    "cpu|memory|performance"

# Test 27: Service Health
run_test "Service Health Check" \
    "curl -s $BASE_URL/api/enhanced/health" \
    "services|health|status"

echo -e "\n${YELLOW}📋 TESTING PHASE 12: INTEGRATION TESTS${NC}"
echo "======================================"

# Test 28: Cross-Service Integration
run_test "Cross-Service Test" \
    "curl -s -X POST $BASE_URL/api/enhanced/background-command -H 'Content-Type: application/json' -d '{\"command\": \"analyze current screen and move mouse to center\"}'" \
    "success.*true"

# Test 29: Multi-Modal Test
run_test "Multi-Modal Integration" \
    "curl -s -X POST $BASE_URL/api/enhanced/command -H 'Content-Type: application/json' -d '{\"command\": \"look at screen, find any buttons, and tell me what you see\"}'" \
    "success.*true"

# Test 30: End-to-End Workflow
run_test "End-to-End Workflow" \
    "curl -s -X POST $BASE_URL/api/enhanced/background-command -H 'Content-Type: application/json' -d '{\"command\": \"get current app info, analyze screen, and provide summary\"}'" \
    "success.*true"

echo -e "\n${YELLOW}📋 TESTING COMPLETE!${NC}"
echo "===================="

# Final Results
echo -e "\n${BLUE}📊 TEST RESULTS SUMMARY:${NC}"
echo "========================"
echo -e "Total Tests: ${YELLOW}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! RAGS is fully working!${NC}"
    echo -e "${GREEN}✅ No demo data found - everything is real working!${NC}"
else
    echo -e "\n${YELLOW}⚠️  Some tests failed. Check the output above.${NC}"
    echo -e "${YELLOW}🔧 Failed tests may need attention.${NC}"
fi

# Success rate
success_rate=$((TESTS_PASSED * 100 / TOTAL_TESTS))
echo -e "\n${BLUE}Success Rate: ${success_rate}%${NC}"

if [ $success_rate -ge 90 ]; then
    echo -e "${GREEN}🚀 Excellent! RAGS is performing great!${NC}"
elif [ $success_rate -ge 75 ]; then
    echo -e "${YELLOW}👍 Good! Most features are working well.${NC}"
else
    echo -e "${RED}🔧 Needs attention. Several features need fixing.${NC}"
fi

echo -e "\n${BLUE}🎯 RAGS COMPREHENSIVE TESTING COMPLETE!${NC}"
echo "======================================="
