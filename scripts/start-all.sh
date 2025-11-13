#!/bin/bash

# ============================================================================
# RAGS AI - Start All Services
# ============================================================================

echo "🚀 Starting RAGS AI..."

# Kill any existing processes
pkill -f "npm run dev" || true
pkill -f "tsx watch" || true

# Start backend in background
echo "📡 Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start desktop app
echo "🖥️  Starting desktop app..."
cd ../desktop && npm run dev &
DESKTOP_PID=$!

echo ""
echo "✅ RAGS AI is running!"
echo ""
echo "📡 Backend: http://localhost:3000"
echo "🖥️  Desktop: http://localhost:1420"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $DESKTOP_PID; exit" INT
wait

