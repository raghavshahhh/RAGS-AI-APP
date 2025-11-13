#!/bin/bash

# ============================================================================
# RAGS AI - Run All Apps Script
# Opens 3 terminals and runs backend, desktop, mobile
# ============================================================================

echo "🚀 RAGS AI - Starting All Apps..."
echo ""

# Get the project directory
PROJECT_DIR="/Users/raghavpratap/Desktop/RAGS.V1"

# ============================================================================
# Terminal 1: Backend
# ============================================================================

echo "📡 Starting Backend Server..."

osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$PROJECT_DIR/backend' && echo '🚀 Starting Backend Server...' && echo '' && echo 'Starting Ollama...' && ollama serve > /dev/null 2>&1 & sleep 2 && echo '✅ Ollama running' && echo '' && npm run dev"
end tell
EOF

sleep 2

# ============================================================================
# Terminal 2: Desktop App
# ============================================================================

echo "💻 Starting Desktop Mac App..."

osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$PROJECT_DIR/desktop' && echo '💻 Starting Desktop Mac App...' && echo '' && echo 'Building Tauri app...' && echo '' && npm run tauri:dev"
end tell
EOF

sleep 2

# ============================================================================
# Terminal 3: Mobile App
# ============================================================================

echo "📱 Starting Mobile iOS App..."

osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$PROJECT_DIR/mobile' && echo '📱 Starting Mobile iOS App...' && echo '' && echo 'Starting Expo...' && echo '' && npm start"
end tell
EOF

echo ""
echo "✅ All terminals opened!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 Terminal 1: Backend (http://localhost:3000)"
echo "💻 Terminal 2: Desktop Mac App"
echo "📱 Terminal 3: Mobile iOS App (press 'i' for simulator)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 What to expect:"
echo ""
echo "Backend:"
echo "  ✅ Ollama service running"
echo "  ✅ Server on port 3000"
echo "  ✅ API endpoints ready"
echo ""
echo "Desktop:"
echo "  ✅ Mac app window opens"
echo "  ✅ JARVIS-style UI"
echo "  ✅ 3D animated orb"
echo "  ✅ Chat panel, memory timeline, personalities"
echo ""
echo "Mobile:"
echo "  ✅ Expo dev server starts"
echo "  ✅ Press 'i' to open iOS simulator"
echo "  ✅ Custom RAGS icon visible"
echo "  ✅ Native-looking app"
echo ""
echo "🔥 Enjoy your AI assistant!"

