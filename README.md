# 🤖 RAGS AI - Your Offline-First AI Operating System

**RAGS** (Raghav's AI General System) is a voice-controlled AI assistant that works **100% offline**, with features like habit tracking, content generation, Instagram posting, and system automation.

Think **JARVIS from Iron Man**, but real and running on your Mac.

---

## ✨ Features

### 🎤 Voice Control (PHASE 1 - ✅ COMPLETE)
- **Always-On Wake Word** - Say "Hey RAGS" anytime
- **Offline Speech-to-Text** - Whisper.cpp (no internet needed)
- **Natural Voice** - ElevenLabs + Coqui TTS
- **Local AI Brain** - Ollama (llama3.2, phi-3, mistral)
- **Persistent Memory** - Remembers all conversations
- **Complete Voice Loop** - Wake word → STT → AI → TTS → Speaker

### 🤖 Agent System (PHASE 2 - Coming Soon)
- Self-executing task engine
- Action graph for chaining tasks
- Autopilot mode for daily routines
- Function calling for tools

### 🎨 UI/UX (PHASE 3 - Coming Soon)
- 3D AI Orb (Three.js)
- Holographic HUD panels
- Command palette (⌘+K)
- Voice visualizer
- Task flow map

### 🖥️ Device Control (PHASE 4 - Coming Soon)
- Mac automation (AppleScript)
- Shortcuts integration
- File system manager
- Browser automation
- System controls

### 📱 Content Creator (PHASE 5 - Coming Soon)
- AI content generation
- Image/video generation
- Instagram auto-posting
- Multi-platform publishing
- Content calendar

### 🧠 Personality (PHASE 6 - Coming Soon)
- Emotional responses
- Hindi/English mix (Hinglish)
- Memory reflection
- Mood AI
- Life score dashboard

---

## 🚀 Quick Start (5 Minutes)

### 1. Install Prerequisites
```bash
# Install Ollama
brew install ollama
ollama serve  # Keep this running

# In new terminal
ollama pull llama3.2:latest

# Install Whisper.cpp
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
make
bash ./models/download-ggml-model.sh base.en
sudo cp main /usr/local/bin/whisper
```

### 2. Get API Keys
- **Picovoice** (Free): https://console.picovoice.ai/
- **Supabase** (Free): https://supabase.com/
- **ElevenLabs** (Optional): https://elevenlabs.io/

### 3. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
```

### 4. Setup Database
Go to Supabase SQL Editor and run the SQL from `SETUP_GUIDE.md`

### 5. Test Voice System
```bash
npm run test:voice
```

Say **"Hey RAGS"** and start talking! 🎤

---

## 📁 Project Structure

```
RAGS.V1/
├── backend/              # Node.js/TypeScript backend
│   ├── src/
│   │   ├── services/     # Core services
│   │   │   ├── wakeword-porcupine.ts    # Wake word detection
│   │   │   ├── stt-whisper-local.ts     # Speech-to-text
│   │   │   ├── tts-hybrid.ts            # Text-to-speech
│   │   │   ├── ollama-brain.ts          # Local AI brain
│   │   │   ├── memory-system.ts         # Memory system
│   │   │   └── voice-pipeline.ts        # Complete pipeline
│   │   ├── routes/       # API routes
│   │   └── config/       # Configuration
│   └── package.json
├── desktop/              # Tauri desktop app
├── mobile/               # React Native mobile app
├── SETUP_GUIDE.md        # Complete setup instructions
├── QUICKSTART.md         # 5-minute quick start
└── PROGRESS_REPORT.md    # Current progress
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **AI:** Ollama (llama3.2, phi-3)
- **STT:** Whisper.cpp (offline)
- **TTS:** ElevenLabs + Coqui (hybrid)
- **Wake Word:** Picovoice Porcupine
- **Database:** Supabase + pgvector
- **Memory:** Semantic search with embeddings

### Desktop
- **Framework:** Tauri (Rust + TypeScript)
- **UI:** React + TypeScript
- **3D:** Three.js
- **Styling:** Tailwind CSS

### Mobile
- **Framework:** React Native + Expo
- **Language:** TypeScript
- **UI:** React Native Reanimated

---

## 📊 Progress

```
PHASE 1: Core Brain          ████████████████████ 100% ✅
PHASE 2: Agent System         ░░░░░░░░░░░░░░░░░░░░   0%
PHASE 3: UI/UX                ░░░░░░░░░░░░░░░░░░░░   0%
PHASE 4: Device Control       ░░░░░░░░░░░░░░░░░░░░   0%
PHASE 5: Content Creator      ░░░░░░░░░░░░░░░░░░░░   0%
PHASE 6: Personality          ░░░░░░░░░░░░░░░░░░░░   0%

Total: 16.7% (1/6 phases complete)
```

---

## 🎯 Roadmap

### ✅ PHASE 1: Core Brain (COMPLETE)
- [x] Wake word detection
- [x] Offline STT
- [x] Hybrid TTS
- [x] Local AI brain
- [x] Memory system
- [x] Voice pipeline

### 🚧 PHASE 2: Agent System (Next)
- [ ] Agent decision engine
- [ ] Action graph
- [ ] Task queue
- [ ] Autopilot mode
- [ ] Function calling

### 📅 PHASE 3-6: Coming Soon
See `PROGRESS_REPORT.md` for details

---

## 🧪 Testing

### Test Voice Pipeline
```bash
cd backend
npm run test:voice
```

### Test Individual Components
```bash
# Test Ollama
node -e "const {OllamaBrain}=require('./dist/services/ollama-brain');new OllamaBrain().chat('Hello').then(console.log)"

# Test Whisper
npm run test:whisper

# Test TTS
npm run test:tts
```

---

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup instructions
- **[PROGRESS_REPORT.md](PROGRESS_REPORT.md)** - Current progress and next steps

---

## 🐛 Troubleshooting

### Ollama not responding
```bash
# Check if running
curl http://localhost:11434/api/tags

# Restart
pkill ollama && ollama serve
```

### Whisper not found
```bash
which whisper
# If not found, reinstall from whisper.cpp
```

### Wake word not detecting
- Check microphone permissions
- Verify Picovoice access key
- List audio devices and select correct one

See `SETUP_GUIDE.md` for more troubleshooting.

---

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

---

## 📝 License

MIT License - See LICENSE file

---

## 🙏 Credits

Built with:
- [Ollama](https://ollama.ai/) - Local LLM
- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) - STT
- [Picovoice Porcupine](https://picovoice.ai/) - Wake word
- [ElevenLabs](https://elevenlabs.io/) - TTS
- [Supabase](https://supabase.com/) - Database
- [Tauri](https://tauri.app/) - Desktop framework

---

**RAGS AI - Your Offline-First AI Operating System** 🚀

Made with ❤️ by Raghav

