#!/bin/bash

# ============================================================================
# RAGS AI - Complete Setup Script
# ============================================================================

echo "🤖 Setting up RAGS AI - Your Complete AI Assistant"
echo "=================================================="

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is designed for macOS only"
    exit 1
fi

# Install Homebrew if not installed
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install required tools
echo "🔧 Installing required tools..."
brew install ollama node ffmpeg imagesnap tesseract

# Install Whisper.cpp
echo "🎤 Setting up Whisper.cpp..."
if [ ! -d "whisper.cpp" ]; then
    git clone https://github.com/ggerganov/whisper.cpp.git
    cd whisper.cpp
    make
    bash ./models/download-ggml-model.sh base.en
    sudo cp main /usr/local/bin/whisper
    cd ..
fi

# Start Ollama and pull model
echo "🧠 Setting up Ollama..."
brew services start ollama
sleep 5
ollama pull llama3.2:latest

# Setup backend
echo "⚙️ Setting up backend..."
cd backend
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    
    echo ""
    echo "🔑 Please add your API keys to backend/.env:"
    echo "   - PICOVOICE_ACCESS_KEY (get from https://console.picovoice.ai/)"
    echo "   - SUPABASE_URL and SUPABASE_ANON_KEY (get from https://supabase.com/)"
    echo "   - ELEVENLABS_API_KEY (optional, for better TTS)"
    echo ""
    echo "Press Enter when you've added the keys..."
    read
fi

# Build backend
npm run build

echo ""
echo "✅ RAGS AI Setup Complete!"
echo ""
echo "🚀 To start RAGS:"
echo "   cd backend && npm run rags"
echo ""
echo "🎤 Say 'Hey RAGS' to activate voice control"
echo "💬 RAGS will welcome you and help with:"
echo "   - Voice conversations in Hindi/English"
echo "   - Mac system control"
echo "   - Research and web search"
echo "   - Camera and screen access"
echo "   - Memory and learning"
echo "   - File management"
echo ""
echo "📖 See README.md for more details"