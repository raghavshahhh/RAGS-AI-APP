#!/bin/bash

# 🚀 RAGS AI - Quick Start Script

echo "🤖 Starting RAGS AI System..."

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "❌ Ollama not running!"
    echo "👉 Run: ollama serve"
    exit 1
fi

echo "✅ Ollama is running"

# Check if Whisper is installed
if ! command -v whisper &> /dev/null; then
    echo "❌ Whisper not found!"
    echo "👉 Install from whisper.cpp"
    exit 1
fi

echo "✅ Whisper is installed"

# Create storage directory
mkdir -p ~/.rags/storage
echo "✅ Storage directory ready"

# Start backend
echo "🚀 Starting backend..."
cd backend && npm run dev
