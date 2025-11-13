# 🚀 RAGS AI - Complete Setup Guide

## Prerequisites

### 1. Install Ollama (Local AI)
```bash
# macOS
brew install ollama

# Start Ollama server (keep running)
ollama serve

# In new terminal, pull models
ollama pull llama3.2:3b
ollama pull llava:latest
ollama pull phi3:mini
```

### 2. Install Node.js
```bash
# macOS
brew install node

# Verify
node --version  # Should be >= 18.0.0
npm --version
```

### 3. Get API Keys (Optional)

**For better features:**
- **Picovoice** (Wake word): https://console.picovoice.ai/
- **ElevenLabs** (Better TTS): https://elevenlabs.io/
- **Gemini** (Vision): https://makersuite.google.com/

---

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/ragspro/RAGS-AI.git
cd RAGS-AI
```

### 2. Setup Backend
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
```

**Edit `backend/.env`:**
```env
# Required
PORT=3000
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# Optional (for better features)
PICOVOICE_ACCESS_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

### 3. Setup Desktop
```bash
cd ../desktop
npm install
```

### 4. Setup Mobile (Optional)
```bash
cd ../mobile
npm install
```

---

## Running RAGS

### Method 1: Separate Terminals

**Terminal 1 - Ollama:**
```bash
ollama serve
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Desktop:**
```bash
cd desktop
npm run dev
```

### Method 2: One Command
```bash
# From project root
./scripts/start-all.sh
```

---

## First Time Setup

### 1. Test Backend
```bash
# Check if backend is running
curl http://localhost:3000

# Should return:
# {"success":true,"message":"RAGS AI Backend is running!"}
```

### 2. Test Ollama
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Should list available models
```

### 3. Open Desktop App
- Desktop app should open automatically
- You'll see the NeoEyes 3D face
- Click the microphone button to start voice control

---

## Voice Control Setup

### 1. Enable Microphone
- macOS will ask for microphone permission
- Allow access for the desktop app

### 2. Test Voice
1. Click the microphone button (or press ⌘+Space)
2. Say something (you'll see interim text)
3. RAGS will respond with voice

### 3. Wake Word (Optional)
If you have Picovoice key:
1. Add key to `.env`
2. Restart backend
3. Say "Hey RAGS" anytime

---

## Camera Vision Setup

### 1. Enable Camera
- macOS will ask for camera permission
- Allow access for the desktop app

### 2. Test Camera
1. Click camera icon in top-right
2. Take a photo
3. Ask "What is this?"
4. RAGS will describe the image

---

## Troubleshooting

### Ollama not responding
```bash
# Check if running
curl http://localhost:11434/api/tags

# If not, restart
pkill ollama
ollama serve
```

### Backend not starting
```bash
# Check port 3000
lsof -i :3000

# Kill if occupied
kill -9 <PID>

# Restart
cd backend && npm run dev
```

### Desktop app not opening
```bash
# Check if Tauri is installed
cd desktop
npm run tauri info

# Rebuild
npm run tauri build
```

### Voice not working
1. Check microphone permissions in System Settings
2. Verify browser supports Web Speech API
3. Try Chrome/Edge (better support)

### Camera not working
1. Check camera permissions in System Settings
2. Verify Ollama has `llava` model
3. Run: `ollama pull llava:latest`

### TTS not speaking
1. Check system volume
2. Verify Edge-TTS is installed: `pip install edge-tts`
3. Check backend logs for errors

---

## Advanced Configuration

### Change AI Model
Edit `backend/.env`:
```env
OLLAMA_MODEL=llama3.1:8b  # More powerful
# or
OLLAMA_MODEL=phi3:mini    # Faster
```

### Change TTS Voice
Edit `backend/src/services/edge-tts.ts`:
```typescript
voice: 'en-IN-PrabhatNeural'  // Male Indian
// or
voice: 'en-IN-NeerjaNeural'   // Female Indian
```

### Add Custom Commands
Edit `backend/src/services/real-ai-integration.ts`:
```typescript
// Add your custom command logic
```

---

## File Locations

### Configuration
- Backend: `backend/.env`
- Desktop: `desktop/src-tauri/tauri.conf.json`

### Data Storage
- Memory: `~/.rags/memory/`
- Reminders: `~/.rags/reminders/`
- Audio cache: `~/.rags/audio/`
- Plugins: `~/.rags/plugins/`

### Logs
- Backend: `backend/logs/`
- Desktop: `~/Library/Logs/RAGS/`

---

## Development

### Backend Development
```bash
cd backend

# Watch mode
npm run dev

# Build
npm run build

# Test
npm run test
```

### Desktop Development
```bash
cd desktop

# Dev mode
npm run dev

# Build for production
npm run tauri build

# Debug
npm run tauri dev
```

### Mobile Development
```bash
cd mobile

# Start Expo
npm start

# iOS
npm run ios

# Android
npm run android
```

---

## Building for Production

### Desktop App
```bash
cd desktop
npm run tauri build

# Output: desktop/src-tauri/target/release/bundle/
```

### Backend (Docker)
```bash
cd backend
docker build -t rags-backend .
docker run -p 3000:3000 rags-backend
```

---

## Next Steps

1. ✅ Test voice control
2. ✅ Try camera vision
3. ✅ Set some reminders
4. ✅ Explore command palette (⌘+K)
5. ✅ Check system monitor
6. ✅ Customize settings

**Enjoy your JARVIS-style AI assistant! 🚀**

---

## Support

- **Issues:** https://github.com/ragspro/RAGS-AI/issues
- **Discussions:** https://github.com/ragspro/RAGS-AI/discussions
- **Email:** raghav@example.com
