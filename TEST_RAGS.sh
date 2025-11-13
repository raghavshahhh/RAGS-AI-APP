#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║    🧪 RAGS AI - Complete System Test                                        ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:3000"

# Test 1: Health Check
echo "✅ Test 1: Health Check"
curl -s $BASE_URL | jq -r '.name, .status'
echo ""

# Test 2: AI Chat (Hindi)
echo "✅ Test 2: AI Chat (Hinglish)"
curl -s -X POST $BASE_URL/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Mujhe coding me help chahiye"}' | jq -r '.response'
echo ""

# Test 3: System Status
echo "✅ Test 3: System Status"
curl -s $BASE_URL/api/v1/system/status | jq '{battery: .system.battery.percentage, charging: .system.battery.charging, wifi: .system.wifi.connected, computer: .system.info.computerName}'
echo ""

# Test 4: AI Models
echo "✅ Test 4: Available AI Models"
curl -s $BASE_URL/api/v1/ai/models | jq -r '.models[]'
echo ""

# Test 5: Notification
echo "✅ Test 5: Mac Notification"
curl -s -X POST $BASE_URL/api/v1/mac/notify \
  -H "Content-Type: application/json" \
  -d '{"title":"RAGS Test","message":"All systems operational!"}' | jq -r '.success'
echo ""

# Test 6: Text to Speech
echo "✅ Test 6: Text to Speech"
curl -s -X POST $BASE_URL/api/v1/mac/speak \
  -H "Content-Type: application/json" \
  -d '{"text":"RAGS AI fully integrated and working"}' | jq -r '.success'
echo ""

# Test 7: Privacy AI Mode
echo "✅ Test 7: Privacy AI Mode"
curl -s -X POST $BASE_URL/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is AI?","usePrivacy":true}' | jq -r '.response'
echo ""

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║    ✅ All Tests Completed!                                                   ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
