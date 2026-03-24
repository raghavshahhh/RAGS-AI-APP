<p align="center">
  <img src="https://raw.githubusercontent.com/raghavshahhh/RAGS-AI-APP/main/desktop/public/logo.png" alt="RAGS AI Logo" width="120">
</p>

<h1 align="center">
  🤖 RAGS AI
</h1>

<p align="center">
  <strong>🚀 Your Offline-First AI Operating System - Think JARVIS, But Real</strong>
</p>

<p align="center">
  <a href="https://github.com/raghavshahhh/RAGS-AI-APP/stargazers">
    <img src="https://img.shields.io/github/stars/raghavshahhh/RAGS-AI-APP?style=for-the-badge&color=yellow" alt="Stars">
  </a>
  <a href="https://github.com/raghavshahhh/RAGS-AI-APP/network/members">
    <img src="https://img.shields.io/github/forks/raghavshahhh/RAGS-AI-APP?style=for-the-badge&color=green" alt="Forks">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-Rust-FFC131?style=flat-square&logo=tauri" alt="Tauri">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Ollama-AI-000000?style=flat-square" alt="Ollama">
  <img src="https://img.shields.io/badge/Three.js-3D-000000?style=flat-square&logo=three.js" alt="Three.js">
  <img src="https://img.shields.io/badge/Mediapipe-Vision-0099FF?style=flat-square&logo=google" alt="Mediapipe">
</p>

---

## 🎯 What is RAGS AI?

**RAGS AI** (Raghav's AI General System) is a **voice-controlled AI assistant** that works **100% offline** with features like Mac automation, camera vision, web search, and intelligent memory. Think **JARVIS from Iron Man**, but real and running on your Mac.

---

## ⭐ Project Status: 95% Complete

| Feature | Status |
|---------|--------|
| **Core AI System** | ✅ 100% |
| **Voice Control** | ✅ 100% |
| **Mac Automation** | ✅ 100% |
| **Camera Vision** | ✅ 100% |
| **Desktop UI** | ✅ 100% |
| **Memory System** | ✅ 100% |
| **Smart Features** | ✅ 100% |
| **Social Media** | ⚠️ 50% |
| **Cross-Device Sync** | ❌ 0% |

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

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│ Desktop: Tauri (Rust + TypeScript)                          │
├─────────────────────────────────────────────────────────────┤
│ Frontend: React + Three.js                                  │
├─────────────────────────────────────────────────────────────┤
│ Styling: Tailwind CSS + Framer Motion                       │
├─────────────────────────────────────────────────────────────┤
│ State: Zustand                                              │
├─────────────────────────────────────────────────────────────┤
│ Backend: Node.js + TypeScript + Express                     │
├─────────────────────────────────────────────────────────────┤
│ AI: Ollama (Local LLM)                                      │
├─────────────────────────────────────────────────────────────┤
│ STT: Whisper.cpp (Offline)                                │
├─────────────────────────────────────────────────────────────┤
│ TTS: Edge-TTS (Indian Accent)                               │
├─────────────────────────────────────────────────────────────┤
│ Wake Word: Picovoice Porcupine                              │
├─────────────────────────────────────────────────────────────┤
│ Vision: MediaPipe + LLaVA                                   │
├─────────────────────────────────────────────────────────────┤
│ Mobile: React Native + Expo                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- macOS 12+ (Mac only)
- Node.js 18+ installed
- Rust toolchain installed
- Ollama installed

### Installation

```bash
# 1. Install Ollama
brew install ollama
ollama serve

# Pull AI models
ollama pull llama3.2:3b
ollama pull llava:latest

# 2. Clone repository
git clone https://github.com/raghavshahhh/RAGS-AI-APP.git
cd RAGS-AI-APP

# 3. Install Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys

# 4. Install Desktop
cd ../desktop
npm install

# 5. Run (2 terminals)
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Desktop
cd desktop && npm run dev
```

---

## 🎯 Voice Commands

Say **"Hey RAGS"** then:

| Command | Action |
|---------|--------|
| "Search Python on web" | Web search |
| "Remember I like coding" | Save to memory |
| "What do you remember?" | Recall memories |
| "Remind me to call John at 5 PM" | Set reminder |
| "Volume up" | System control |
| "Take a screenshot" | Capture screen |
| "Open folder Desktop" | File operations |
| "What is this?" | Camera vision |
| "Open YouTube" | Browser automation |

---

## 📁 Project Structure

```
RAGS-AI-APP/
├── backend/              # Node.js/TypeScript backend
│   ├── src/
│   │   ├── services/    # 70+ core services
│   │   ├── routes/      # API endpoints
│   │   └── config/      # Configuration
│   └── package.json
├── desktop/              # Tauri desktop app
│   ├── src/
│   │   ├── components/  # 30+ React components
│   │   ├── services/    # API integration
│   │   └── store/       # State management
│   └── src-tauri/       # Rust backend
├── mobile/               # React Native mobile app
└── docs/                 # Documentation
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing`
5. Open Pull Request

---

## 📞 Contact

<p align="center">
  <a href="mailto:ragsproai@gmail.com">
    <img src="https://img.shields.io/badge/Email-ragsproai@gmail.com-red?style=for-the-badge&logo=gmail" alt="Email">
  </a>
  <a href="https://ragspro.com">
    <img src="https://img.shields.io/badge/Website-ragspro.com-blue?style=for-the-badge&logo=google-chrome" alt="Website">
  </a>
</p>

---

<p align="center">
  Made with ❤️ by <strong>Raghav Shah</strong>
  <br>
  © 2024-2026 All Rights Reserved
</p>

<p align="center">
  <img src="https://hit.yhype.me/github/profile?user_id=raghavshahhh" alt="Profile Views" width="1" height="1">
</p>
