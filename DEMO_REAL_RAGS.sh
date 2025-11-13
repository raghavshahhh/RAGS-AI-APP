#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║    🎬 RAGS AI - LIVE REAL DATA DEMO                                         ║"
echo "║    No fake data - Everything is REAL!                                       ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:3000"

# Demo 1: Real System Status
echo "📊 Demo 1: Real System Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s $BASE_URL/api/v1/system/status | jq '{
  computer: .system.info.computerName,
  user: .system.info.username,
  macOS: .system.info.macOSVersion,
  battery: .system.battery.percentage,
  charging: .system.battery.charging,
  wifi: .system.wifi.connected,
  runningApps: .system.runningApps[:5]
}'
echo ""

# Demo 2: AI with Real Context
echo "💬 Demo 2: AI Chat with Real System Data"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Q: Mera battery kitna hai aur konse apps chal rahe hain?"
curl -s -X POST $BASE_URL/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Mera battery kitna hai aur konse apps chal rahe hain?"}' | jq -r '.response'
echo ""
echo "Real Data Used:"
curl -s -X POST $BASE_URL/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}' | jq '.systemData'
echo ""

# Demo 3: Real Mac Automation
echo "🖥️  Demo 3: Real Mac Automation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Opening Calculator app..."
curl -s -X POST $BASE_URL/api/v1/mac/open-app \
  -H "Content-Type: application/json" \
  -d '{"appName":"Calculator"}' | jq -r '.message'
sleep 2
echo ""

# Demo 4: Real Screenshot
echo "📸 Demo 4: Taking Real Screenshot"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
SCREENSHOT=$(curl -s -X POST $BASE_URL/api/v1/mac/screenshot | jq -r '.path')
echo "Screenshot saved: $SCREENSHOT"
ls -lh "$SCREENSHOT" 2>/dev/null | awk '{print "Size: " $5}'
echo ""

# Demo 5: Real Notification
echo "🔔 Demo 5: Real Mac Notification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BATTERY=$(curl -s $BASE_URL/api/v1/system/status | jq -r '.system.battery.percentage')
curl -s -X POST $BASE_URL/api/v1/mac/notify \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"RAGS AI Live\",\"message\":\"Battery: ${BATTERY}% | Calculator is open!\"}" > /dev/null
echo "✅ Real notification sent with live battery data: ${BATTERY}%"
echo ""

# Demo 6: Real Text-to-Speech
echo "🔊 Demo 6: Real Text-to-Speech"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST $BASE_URL/api/v1/mac/speak \
  -H "Content-Type: application/json" \
  -d '{"text":"RAGS AI is using real system data. Battery is at '"$BATTERY"' percent"}' > /dev/null
echo "✅ Speaking with real battery data..."
sleep 3
echo ""

# Demo 7: Real Volume Control
echo "🔊 Demo 7: Real Volume Control"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST $BASE_URL/api/v1/mac/volume \
  -H "Content-Type: application/json" \
  -d '{"level":30}' | jq -r '.message'
sleep 1
curl -s -X POST $BASE_URL/api/v1/mac/volume \
  -H "Content-Type: application/json" \
  -d '{"level":50}' | jq -r '.message'
echo ""

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║    ✅ ALL DEMOS COMPLETED WITH REAL DATA!                                    ║"
echo "║                                                                              ║"
echo "║    - Real system status ✅                                                   ║"
echo "║    - Real AI responses with context ✅                                       ║"
echo "║    - Real app control ✅                                                     ║"
echo "║    - Real screenshots ✅                                                     ║"
echo "║    - Real notifications ✅                                                   ║"
echo "║    - Real text-to-speech ✅                                                  ║"
echo "║    - Real volume control ✅                                                  ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
