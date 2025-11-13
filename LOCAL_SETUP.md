# 🔒 100% Local RAGS Setup Guide

## ✅ Kya Kya Local Hai (Offline)
- ✅ **Voice Recognition** - Whisper.cpp (laptop pe)
- ✅ **AI Brain** - Ollama (laptop pe)
- ✅ **Wake Word** - Porcupine (laptop pe)
- ✅ **All Data** - SQLite database (laptop pe)
- ✅ **Conversations** - Local storage (laptop pe)
- ✅ **Files** - Local filesystem (laptop pe)

## 🌐 Kya Online Hai (Optional)
- 🌐 **Gemini AI** - Better responses (optional)
- 🌐 **ElevenLabs** - Better voice (optional)
- 🌐 **Instagram** - Posting only (optional)

---

## 🚀 Step 1: Backend Setup

### 1. Environment File Banao
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1/backend
cp .env.example .env
```

### 2. `.env` File Edit Karo
```bash
nano .env
# Ya VS Code mein kholo
```

### 3. Required Keys (Must Have)
```env
# Server
PORT=3000
NODE_ENV=development

# Ollama (Local AI - No API Key Needed!)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest

# Whisper (Local STT - No API Key Needed!)
WHISPER_CPP_PATH=/usr/local/bin/whisper
WHISPER_MODEL_PATH=/Users/raghavpratap/whisper.cpp/models/ggml-base.en.bin

# Picovoice Wake Word (Free API Key)
PICOVOICE_ACCESS_KEY=your_key_here
# Get from: https://console.picovoice.ai/

# Local Storage (No API Key Needed!)
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=/Users/raghavpratap/.rags/storage
```

### 4. Optional Keys (Better Features)
```env
# Gemini AI (Free 60 requests/min)
GEMINI_API_KEY=your_gemini_key_here
# Get from: https://makersuite.google.com/app/apikey

# ElevenLabs (Better Voice - Optional)
ELEVENLABS_API_KEY=your_key_here
# Get from: https://elevenlabs.io/
```

---

## 🔑 Gemini API Key Kaise Laaye

### Step 1: Google AI Studio Jao
```
https://makersuite.google.com/app/apikey
```

### Step 2: "Create API Key" Click Karo

### Step 3: Key Copy Karo

### Step 4: `.env` File Mein Paste Karo
```env
GEMINI_API_KEY=AIzaSyC_your_actual_key_here
```

### Step 5: Backend Restart Karo
```bash
cd backend
npm run dev
```

---

## 💾 100% Local Storage Setup

### Option 1: SQLite (Recommended - Fully Offline)
```bash
# Install SQLite
brew install sqlite3

# Backend automatically creates database at:
# ~/.rags/storage/rags.db
```

### Option 2: Local Files (Simplest)
```bash
# All data stored in:
# ~/.rags/storage/
#   ├── conversations/
#   ├── memories/
#   ├── habits/
#   ├── content/
#   └── settings.json
```

---

## 🎯 Complete Run Karne Ka Tarika

### Terminal 1: Ollama Start Karo
```bash
ollama serve
```

### Terminal 2: Backend Start Karo
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1/backend
npm install
npm run dev
```

### Terminal 3: Desktop App Start Karo
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1/desktop
npm install
npm run tauri dev
```

---

## 🔍 Check Karo Sab Kuch Local Hai

### 1. Ollama Check
```bash
curl http://localhost:11434/api/tags
# Response aana chahiye with models list
```

### 2. Whisper Check
```bash
which whisper
# Path dikhna chahiye: /usr/local/bin/whisper
```

### 3. Local Storage Check
```bash
ls -la ~/.rags/storage/
# Folder dikhna chahiye with data files
```

### 4. Backend Check
```bash
curl http://localhost:3000/health
# Response: {"status":"ok","storage":"local"}
```

---

## 📊 Data Kahan Store Hota Hai

```
~/.rags/
├── storage/
│   ├── rags.db              # SQLite database (all data)
│   ├── conversations/       # Chat history
│   ├── memories/            # Long-term memory
│   ├── habits/              # Habit tracking
│   ├── content/             # Generated content
│   ├── voice_recordings/    # Voice clips (optional)
│   └── settings.json        # User settings
├── models/
│   └── whisper-base.en.bin  # Whisper model
└── logs/
    └── rags.log             # System logs
```

**Sab kuch tumhare laptop mein! Kuch bhi bahar nahi jata! 🔒**

---

## 🛡️ Privacy Settings

### Backend mein Privacy Mode Enable Karo
```env
# .env file mein add karo
PRIVACY_MODE=strict
TELEMETRY_ENABLED=false
CLOUD_SYNC=false
ANALYTICS_ENABLED=false
```

### Desktop App mein Privacy Check
Settings → Privacy → Enable:
- ✅ Store everything locally
- ✅ Never send data to cloud
- ✅ Disable telemetry
- ✅ Offline-first mode

---

## 🐛 Troubleshooting

### Ollama Not Running
```bash
# Check
curl http://localhost:11434/api/tags

# Restart
pkill ollama && ollama serve
```

### Whisper Not Found
```bash
# Reinstall
cd ~/whisper.cpp
make clean && make
sudo cp main /usr/local/bin/whisper
```

### Storage Permission Error
```bash
# Create storage folder
mkdir -p ~/.rags/storage
chmod 755 ~/.rags/storage
```

### Gemini API Not Working
```bash
# Test API key
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_KEY"
```

---

## ✅ Final Checklist

- [ ] Ollama installed and running
- [ ] Whisper.cpp installed
- [ ] Backend `.env` file configured
- [ ] Picovoice key added
- [ ] Gemini key added (optional)
- [ ] Local storage folder created
- [ ] Backend running on port 3000
- [ ] Desktop app running

---

## 🎉 Test Karo!

```bash
# Backend test
cd backend
npm run test:voice

# Say "Hey RAGS" and talk!
```

---

**Sab kuch local! Tumhara data tumhare paas! 🔒🚀**
