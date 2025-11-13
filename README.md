# 🤖 RAGS AI - Your Offline-First AI Operating System

**RAGS** (Raghav's AI General System) is a voice-controlled AI assistant that works **100% offline**, with features like Mac automation, camera vision, web search, and intelligent memory.

Think **JARVIS from Iron Man**, but real and running on your Mac.

[![GitHub](https://img.shields.io/badge/GitHub-ragspro%2FRAGS--AI-blue)](https://github.com/ragspro/RAGS-AI)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-95%25%20Complete-brightgreen)](docs/STATUS.md)

---

## ✨ Features

### 🎤 Voice Control
- **Always-On Wake Word** - Say "Hey RAGS" anytime
- **Offline Speech-to-Text** - Whisper.cpp (no internet needed)
- **Natural Voice** - Edge-TTS with Indian accent (Rishi)
- **Continuous Listening** - Hindi/English/Hinglish support
- **Interim Transcription** - See text while speaking

### 🧠 AI Brain
- **Local AI** - Ollama (llama3.2:3b, llava, phi3)
- **Context-Aware** - Knows what you're doing
- **Emotional Responses** - Personality engine
- **Web Search** - Real-time DuckDuckGo integration
- **Memory System** - Remembers everything locally

### 🖥️ Mac Automation
- **File Operations** - Open, create, move files/folders
- **App Control** - Launch and manage applications
- **System Control** - Volume, screenshots, notifications
- **Browser Automation** - Scroll, click, navigate
- **AppleScript Integration** - Full Mac control

### 👁️ Camera Vision
- **LLaVA Integration** - See and understand images
- **Object Recognition** - Identify objects in real-time
- **Scene Description** - Describe what's visible
- **Visual Q&A** - Answer questions about images

### 🎨 Desktop UI
- **3D NeoEyes** - Animated AI face with emotions
- **Voice Visualizer** - Real-time audio visualization
- **Command Palette** - Quick actions (⌘+K)
- **Glassmorphism UI** - Modern, beautiful interface
- **Multiple Panels** - Notes, Reminders, Browser Control, System Monitor

### 🤖 Smart Features
- **Smart Reminders** - Natural language time parsing
- **Autopilot Mode** - Automated daily routines
- **Plugin Framework** - Extensible with custom plugins
- **Context Awareness** - Active window detection
- **Personality Engine** - Emotional intelligence

---

## 📊 Project Status

```
✅ Core AI System          100%
✅ Voice Control           100%
✅ Mac Automation          100%
✅ Camera Vision           100%
✅ Desktop UI              100%
✅ Memory System           100%
✅ Smart Features          100%
⚠️  Social Media           50%
❌ Cross-Device Sync       0%

Overall: 95% Complete
```

**See [STATUS.md](docs/STATUS.md) for detailed feature breakdown**

---

## 🚀 Quick Start

### Prerequisites
```bash
# Install Ollama
brew install ollama
ollama serve

# Pull AI models
ollama pull llama3.2:3b
ollama pull llava:latest
```

### Installation
```bash
# Clone repository
git clone https://github.com/ragspro/RAGS-AI.git
cd RAGS-AI

# Install backend
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys

# Install desktop
cd ../desktop
npm install
```

### Run
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Desktop
cd desktop && npm run dev
```

**See [SETUP.md](docs/SETUP.md) for detailed setup instructions**

---

## 📁 Project Structure

```
RAGS.V1/
├── backend/              # Node.js/TypeScript backend
│   ├── src/
│   │   ├── services/     # 70+ core services
│   │   ├── routes/       # API endpoints
│   │   └── config/       # Configuration
│   └── package.json
├── desktop/              # Tauri desktop app
│   ├── src/
│   │   ├── components/   # 30+ React components
│   │   ├── services/     # API integration
│   │   └── store/        # State management
│   └── src-tauri/        # Rust backend
├── mobile/               # React Native mobile app
└── docs/                 # Documentation
```

---

## 🛠️ Tech Stack

**Backend:**
- Node.js + TypeScript + Express.js
- Ollama (Local LLM)
- Whisper.cpp (Offline STT)
- Edge-TTS (Indian accent TTS)
- Picovoice Porcupine (Wake word)
- Puppeteer (Browser automation)
- Socket.io (Real-time communication)

**Desktop:**
- Tauri (Rust + TypeScript)
- React + Three.js
- Framer Motion + Tailwind CSS
- Zustand (State management)

**Mobile:**
- React Native + Expo
- TypeScript

---

## 🎯 Voice Commands

Say **"Hey RAGS"** then:

```
✅ "search Python on web"
✅ "remember I like coding"
✅ "what do you remember?"
✅ "remind me to call John at 5 PM"
✅ "show my reminders"
✅ "volume up"
✅ "take a screenshot"
✅ "open folder Desktop"
✅ "start autopilot"
✅ "what is this?" (camera)
✅ "scroll down"
✅ "open YouTube"
```

---

## 📚 Documentation

- **[SETUP.md](docs/SETUP.md)** - Complete setup guide
- **[STATUS.md](docs/STATUS.md)** - Feature status & roadmap
- **[API.md](docs/API.md)** - API documentation
- **[COMMANDS.md](docs/COMMANDS.md)** - Voice commands reference

---

## 🎥 Demo

*(Add screenshots/videos here)*

---

## 🤝 Contributing

This is a personal project, but suggestions and contributions are welcome!

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📝 License

MIT License - See [LICENSE](LICENSE) file

---

## 🙏 Credits

Built with:
- [Ollama](https://ollama.ai/) - Local LLM
- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) - STT
- [Picovoice Porcupine](https://picovoice.ai/) - Wake word
- [Edge-TTS](https://github.com/rany2/edge-tts) - TTS
- [Tauri](https://tauri.app/) - Desktop framework
- [Three.js](https://threejs.org/) - 3D graphics

---

## 📧 Contact

**Raghav** - [@ragspro](https://github.com/ragspro)

**Project Link:** https://github.com/ragspro/RAGS-AI

---

**RAGS AI - Your Offline-First AI Operating System** 🚀

Made with ❤️ by Raghav
