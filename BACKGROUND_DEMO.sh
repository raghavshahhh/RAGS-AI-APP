#!/bin/bash

# 🔍 RAGS BACKGROUND MONITORING DEMO
# Demonstrates RAGS working in background with any app/website

echo "🚀 RAGS Background Monitoring Demo"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000/api/enhanced"

echo -e "${BLUE}📊 Checking RAGS Status...${NC}"
curl -s "$BASE_URL/status" | jq '.status.capabilities'
echo ""

echo -e "${BLUE}🔍 Background Monitoring Status...${NC}"
curl -s "$BASE_URL/background/status" | jq '.status | {isMonitoring, activeContext: .activeContext.appName, taskQueue}'
echo ""

echo -e "${YELLOW}🌐 Opening Google Chrome with Google.com...${NC}"
open -a "Google Chrome" "https://google.com"
sleep 3

echo -e "${BLUE}📱 Current Active Context:${NC}"
curl -s "$BASE_URL/background/context" | jq '.activeContext | {appName, windowTitle, isWebBrowser, url}'
echo ""

echo -e "${GREEN}🎯 Testing Background Commands...${NC}"
echo ""

echo -e "${YELLOW}1. Taking screenshot in background...${NC}"
RESULT=$(curl -s -X POST "$BASE_URL/background-command" \
  -H "Content-Type: application/json" \
  -d '{"command": "take a screenshot"}')
echo "$RESULT" | jq '.response'
echo ""

echo -e "${YELLOW}2. Scrolling down on current page...${NC}"
RESULT=$(curl -s -X POST "$BASE_URL/background-command" \
  -H "Content-Type: application/json" \
  -d '{"command": "scroll down on this page"}')
echo "$RESULT" | jq '.response'
echo ""

echo -e "${YELLOW}3. Moving mouse to center...${NC}"
RESULT=$(curl -s -X POST "$BASE_URL/background-command" \
  -H "Content-Type: application/json" \
  -d '{"command": "move mouse to center of screen"}')
echo "$RESULT" | jq '.response'
echo ""

echo -e "${BLUE}📝 Opening TextEdit...${NC}"
open -a "TextEdit"
sleep 2

echo -e "${BLUE}📱 New Active Context:${NC}"
curl -s "$BASE_URL/background/context" | jq '.activeContext | {appName, windowTitle, isWebBrowser}'
echo ""

echo -e "${YELLOW}4. Typing text in TextEdit...${NC}"
RESULT=$(curl -s -X POST "$BASE_URL/background-command" \
  -H "Content-Type: application/json" \
  -d '{"command": "type Hello from RAGS background monitoring!"}')
echo "$RESULT" | jq '.response'
echo ""

echo -e "${BLUE}🔄 Switching back to Chrome...${NC}"
osascript -e 'tell application "Google Chrome" to activate'
sleep 1

echo -e "${BLUE}📱 Active Context After Switch:${NC}"
curl -s "$BASE_URL/background/context" | jq '.activeContext | {appName, windowTitle, isWebBrowser}'
echo ""

echo -e "${YELLOW}5. Navigating to YouTube...${NC}"
RESULT=$(curl -s -X POST "$BASE_URL/background-command" \
  -H "Content-Type: application/json" \
  -d '{"command": "navigate to youtube.com"}')
echo "$RESULT" | jq '.response'
sleep 3
echo ""

echo -e "${YELLOW}6. Scrolling on YouTube...${NC}"
RESULT=$(curl -s -X POST "$BASE_URL/background-command" \
  -H "Content-Type: application/json" \
  -d '{"command": "scroll down"}')
echo "$RESULT" | jq '.response'
echo ""

echo -e "${BLUE}📊 Background Task History:${NC}"
curl -s "$BASE_URL/background/tasks?limit=5" | jq '.tasks[] | {command: .command, status: .status, context: .context.appName}'
echo ""

echo -e "${GREEN}✅ Demo Complete!${NC}"
echo ""
echo -e "${BLUE}🎯 Key Features Demonstrated:${NC}"
echo "• ✅ Continuous background monitoring"
echo "• ✅ Active app/website detection"
echo "• ✅ Context-aware command processing"
echo "• ✅ Cross-application control"
echo "• ✅ Browser automation"
echo "• ✅ System integration"
echo "• ✅ Task history tracking"
echo ""
echo -e "${YELLOW}🚀 RAGS can now work in background with ANY app or website!${NC}"
