#!/bin/bash

# 🚀 RAGS AI - AUTO SETUP SCRIPT
# Complete user-friendly setup for RAGS AI system

echo "🚀 Welcome to RAGS AI Auto Setup!"
echo "This script will set up everything you need to run RAGS."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🎯 $1${NC}"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS. Please install dependencies manually."
    exit 1
fi

print_header "Step 1: Checking System Requirements"

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    print_info "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    print_status "Homebrew installed"
else
    print_status "Homebrew already installed"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_info "Installing Node.js..."
    brew install node
    print_status "Node.js installed"
else
    NODE_VERSION=$(node --version)
    print_status "Node.js already installed: $NODE_VERSION"
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm not found. Please install Node.js manually."
    exit 1
fi

print_header "Step 2: Installing RAGS Dependencies"

# Install imagesnap for camera functionality
if ! command -v imagesnap &> /dev/null; then
    print_info "Installing imagesnap for camera functionality..."
    brew install imagesnap
    print_status "imagesnap installed"
else
    print_status "imagesnap already installed"
fi

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    print_info "Installing Ollama for AI functionality..."
    brew install ollama
    print_status "Ollama installed"
else
    print_status "Ollama already installed"
fi

print_header "Step 3: Setting up Ollama AI Models"

# Start Ollama service
print_info "Starting Ollama service..."
brew services start ollama
sleep 3

# Pull required models
print_info "Downloading AI models (this may take a while)..."

# Pull LLaVA for vision
if ! ollama list | grep -q "llava"; then
    print_info "Downloading LLaVA vision model..."
    ollama pull llava:latest
    print_status "LLaVA vision model downloaded"
else
    print_status "LLaVA vision model already available"
fi

# Pull a lightweight text model
if ! ollama list | grep -q "llama3.2:3b"; then
    print_info "Downloading Llama 3.2 3B model..."
    ollama pull llama3.2:3b
    print_status "Llama 3.2 3B model downloaded"
else
    print_status "Llama 3.2 3B model already available"
fi

print_header "Step 4: Installing RAGS Backend Dependencies"

# Navigate to backend directory
cd backend

# Install backend dependencies
print_info "Installing backend dependencies..."
npm install
print_status "Backend dependencies installed"

print_header "Step 5: Installing RAGS Frontend Dependencies"

# Navigate to desktop frontend
cd ../desktop

# Install desktop dependencies
print_info "Installing desktop frontend dependencies..."
npm install
print_status "Desktop frontend dependencies installed"

# Navigate to mobile frontend
cd ../mobile

# Install mobile dependencies
print_info "Installing mobile frontend dependencies..."
npm install
print_status "Mobile frontend dependencies installed"

# Go back to root
cd ..

print_header "Step 6: Setting up Environment Configuration"

# Create .env file for backend if it doesn't exist
if [ ! -f "backend/.env" ]; then
    print_info "Creating environment configuration..."
    cat > backend/.env << EOF
# RAGS AI Configuration
NODE_ENV=development
PORT=3000

# Ollama Configuration
OLLAMA_MODEL=llama3.2:3b
OLLAMA_BASE_URL=http://localhost:11434

# Vision Configuration
VISION_ENABLED=true
VISION_PROVIDER=ollama
VISION_MODEL=llava:latest

# Camera Configuration
CAMERA_MONITORING_ENABLED=true

# Performance Configuration
NODE_OPTIONS=--max-old-space-size=4096
EOF
    print_status "Environment configuration created"
else
    print_status "Environment configuration already exists"
fi

print_header "Step 7: Creating Launch Scripts"

# Create easy launch script
cat > start-rags.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting RAGS AI System..."

# Start Ollama service
echo "📡 Starting Ollama service..."
brew services start ollama
sleep 2

# Function to start backend
start_backend() {
    echo "🔧 Starting RAGS Backend..."
    cd backend
    NODE_OPTIONS="--max-old-space-size=4096" npm run dev &
    BACKEND_PID=$!
    cd ..
    echo "✅ Backend started (PID: $BACKEND_PID)"
}

# Function to start desktop frontend
start_desktop() {
    echo "🖥️  Starting Desktop Frontend..."
    cd desktop
    npm run dev &
    DESKTOP_PID=$!
    cd ..
    echo "✅ Desktop frontend started (PID: $DESKTOP_PID)"
}

# Function to start mobile frontend
start_mobile() {
    echo "📱 Starting Mobile Frontend..."
    cd mobile
    npm start &
    MOBILE_PID=$!
    cd ..
    echo "✅ Mobile frontend started (PID: $MOBILE_PID)"
}

# Start all services
start_backend
sleep 5
start_desktop
sleep 3
start_mobile

echo ""
echo "🎉 RAGS AI is now running!"
echo ""
echo "📍 Access Points:"
echo "   🔧 Backend API: http://localhost:3000"
echo "   🖥️  Desktop App: http://localhost:1420"
echo "   📱 Mobile App: http://localhost:8081"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap 'echo "🛑 Stopping RAGS AI..."; kill $BACKEND_PID $DESKTOP_PID $MOBILE_PID 2>/dev/null; exit' INT
wait
EOF

chmod +x start-rags.sh
print_status "Launch script created: start-rags.sh"

# Create quick test script
cat > test-rags.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing RAGS AI System..."

# Test backend
echo "🔧 Testing backend..."
if curl -s http://localhost:3000/ > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running"
fi

# Test desktop frontend
echo "🖥️  Testing desktop frontend..."
if curl -s http://localhost:1420/ > /dev/null; then
    echo "✅ Desktop frontend is running"
else
    echo "❌ Desktop frontend is not running"
fi

# Test mobile frontend
echo "📱 Testing mobile frontend..."
if curl -s http://localhost:8081/ > /dev/null; then
    echo "✅ Mobile frontend is running"
else
    echo "❌ Mobile frontend is not running"
fi

# Test AI capabilities
echo "🤖 Testing AI capabilities..."
if curl -s http://localhost:3000/api/enhanced/status | grep -q "success"; then
    echo "✅ AI capabilities are working"
else
    echo "❌ AI capabilities are not working"
fi

echo "🧪 Test complete!"
EOF

chmod +x test-rags.sh
print_status "Test script created: test-rags.sh"

print_header "Step 8: Final Setup"

# Create desktop shortcut info
print_info "Creating quick access information..."
cat > QUICK_START.md << 'EOF'
# 🚀 RAGS AI - Quick Start Guide

## Starting RAGS
```bash
./start-rags.sh
```

## Testing RAGS
```bash
./test-rags.sh
```

## Access Points
- **Backend API**: http://localhost:3000
- **Desktop App**: http://localhost:1420  
- **Mobile App**: http://localhost:8081

## Features Available
- ✅ Real-time camera vision and gesture recognition
- ✅ Intelligent conversation with memory
- ✅ Mouse and screen control
- ✅ Background app monitoring
- ✅ Browser automation
- ✅ Voice interaction
- ✅ Cross-platform mobile and desktop apps

## First Time Usage
1. Run `./start-rags.sh`
2. Open http://localhost:1420 in your browser
3. Allow camera permissions when prompted
4. Say "Hello RAGS" or wave at the camera
5. RAGS will greet you and remember your preferences!

## Troubleshooting
- If camera doesn't work: Check camera permissions in System Preferences
- If AI doesn't respond: Make sure Ollama is running (`brew services start ollama`)
- If ports are busy: Kill existing processes (`killall node`)

Enjoy your AI assistant! 🤖✨
EOF

print_status "Quick start guide created"

print_header "🎉 RAGS AI Setup Complete!"

echo ""
echo -e "${GREEN}🚀 RAGS AI has been successfully set up!${NC}"
echo ""
echo -e "${CYAN}📋 What's been installed:${NC}"
echo "   ✅ Node.js and npm"
echo "   ✅ Ollama AI platform"
echo "   ✅ LLaVA vision model"
echo "   ✅ Llama 3.2 3B text model"
echo "   ✅ imagesnap for camera"
echo "   ✅ All RAGS dependencies"
echo ""
echo -e "${CYAN}🎯 Next Steps:${NC}"
echo "   1. Run: ${YELLOW}./start-rags.sh${NC} to start RAGS"
echo "   2. Open: ${YELLOW}http://localhost:1420${NC} in your browser"
echo "   3. Allow camera permissions when prompted"
echo "   4. Say 'Hello RAGS' or wave at the camera!"
echo ""
echo -e "${CYAN}📖 Documentation:${NC}"
echo "   • Read QUICK_START.md for detailed instructions"
echo "   • Run ./test-rags.sh to test all features"
echo ""
echo -e "${GREEN}🤖 RAGS is ready to be your intelligent AI assistant!${NC}"
echo ""

# Ask if user wants to start RAGS now
read -p "Would you like to start RAGS now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Starting RAGS AI..."
    ./start-rags.sh
fi
