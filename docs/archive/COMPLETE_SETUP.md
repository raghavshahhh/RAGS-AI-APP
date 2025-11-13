# 🚀 RAGS AI - Complete Setup (5 Minutes)

## ✅ System Requirements
- ✅ Mac M1/M2/M3 (Apple Silicon)
- ✅ macOS 12+ (Monterey or later)
- ✅ 8GB RAM minimum (16GB recommended)
- ✅ 10GB free disk space

---

## 📦 Step 1: Install Prerequisites (2 min)

### 1.1 Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 1.2 Install Ollama
```bash
brew install ollama
```

### 1.3 Install Whisper.cpp
```bash
cd ~
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
make
bash ./models/download-ggml-model.sh base.en
sudo cp main /usr/local/bin/whisper
```

### 1.4 Install Node.js (if not installed)
```bash
brew install node
```

---

## 🔑 Step 2: Get API Keys (2 min)

### 2.1 Picovoice (Required - Free)
1. Go to: https://console.picovoice.ai/
2. Sign up (free)
3. Create new key
4. Copy the key

### 2.2 Gemini (Optional - Free)
1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

**Note:** Gemini is OPTIONAL. RAGS works 100% offline without it!

---

## ⚙️ Step 3: Configure RAGS (1 min)

### 3.1 Edit .env file
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1/backend
nano .env
```

### 3.2 Add your keys
```env
# Required
PICOVOICE_ACCESS_KEY=your_actual_picovoice_key_here

# Optional (for better responses)
GEMINI_API_KEY=your_actual_gemini_key_here

# Everything else is already configured!
```

Save and exit (Ctrl+X, then Y, then Enter)

---

## 🚀 Step 4: Run RAGS!

### Option 1: One-Command Start (Recommended)
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1
./RUN_RAGS.sh
```

### Option 2: Manual Start (3 terminals)

**Terminal 1 - Ollama:**
```bash
ollama serve
```

**Terminal 2 - Backend:**
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1/backend
npm install
npm run dev
```

**Terminal 3 - Desktop:**
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1/desktop
npm install
npm run tauri:dev
```

---

## 🎯 Step 5: First Use

1. Desktop app will open
2. Complete welcome screen (name, preferences)
3. Click mic button 🎤
4. Say "Hey RAGS, hello!"
5. RAGS will respond! 🎉

---

## 🔒 Privacy Settings

### 100% Local Mode (No Internet)
```env
# In .env file, leave Gemini blank:
GEMINI_API_KEY=

# RAGS will use only Ollama (100% offline)
```

### Hybrid Mode (Better Responses)
```env
# Add Gemini key:
GEMINI_API_KEY=your_key_here

# Gemini only improves responses, doesn't store data
```

---

## 📊 What Gets Stored Locally

All your data is stored in: `~/.rags/storage/`

```
~/.rags/storage/
├── conversations/     # All chats
├── memories/          # Long-term memory
├── habits/            # Habit tracking
├── content/           # Generated content
└── settings.json      # Your preferences
```

**Nothing goes to cloud! Everything is on your Mac! 🔒**

---

## 🎮 Features You Can Use

### Voice Commands
- "Hey RAGS, what time is it?"
- "Open Safari"
- "Set volume to 50"
- "Take a screenshot"
- "What's on my clipboard?"
- "Open my desktop folder"

### System Control
- Volume control
- Brightness control
- App management
- File operations
- Notifications
- Screenshots

### AI Features
- Natural conversations (Hinglish)
- Context awareness
- Memory of past chats
- Proactive suggestions
- Emotion detection

---

## 🐛 Troubleshooting

### White Screen Issue
```bash
# Clear cache and restart
cd /Users/raghavpratap/Desktop/RAGS.V1/desktop
rm -rf node_modules dist
npm install
npm run tauri:dev
```

### Ollama Not Responding
```bash
# Check status
curl http://localhost:11434/api/tags

# Restart
pkill ollama
ollama serve
```

### Backend Not Starting
```bash
# Check logs
tail -f /Users/raghavpratap/Desktop/RAGS.V1/logs/backend.log

# Restart
cd backend
npm run dev
```

### Whisper Not Found
```bash
# Check installation
which whisper

# Reinstall if needed
cd ~/whisper.cpp
make clean && make
sudo cp main /usr/local/bin/whisper
```

---

## 📈 Performance Tips (M1 Mac)

### 1. Use Smaller Models (Faster)
```bash
# In .env
OLLAMA_MODEL=llama3.2:3b  # Fast, good quality
```

### 2. Use Larger Models (Better Quality)
```bash
# In .env
OLLAMA_MODEL=llama3.1:8b  # Slower, better responses
```

### 3. Enable Gemini (Best Quality)
```env
GEMINI_API_KEY=your_key_here
# Gemini helps improve responses without storing data
```

---

## 🎯 What's Working Now

- ✅ Voice input/output
- ✅ Local AI (Ollama)
- ✅ Optional Gemini enhancement
- ✅ System control (Mac)
- ✅ File operations
- ✅ Memory system
- ✅ Hinglish support
- ✅ 100% privacy mode

---

## 🚀 Next Steps

1. Try voice commands
2. Explore system control
3. Check memory timeline
4. Customize settings
5. Add more automations

---

## 💡 Pro Tips

1. **Use keyboard shortcuts:**
   - `⌘+K` - Command palette
   - `⌘+Space` - Voice input
   - `Esc` - Close panels

2. **Privacy first:**
   - All data stays local
   - Gemini only improves responses
   - No telemetry, no tracking

3. **M1 optimized:**
   - Uses Apple Silicon efficiently
   - Low battery usage
   - Fast response times

---

## 📞 Need Help?

Check logs:
```bash
# Backend logs
tail -f logs/backend.log

# Ollama logs
tail -f ~/.ollama/logs/server.log
```

---

**RAGS AI - Your Personal AI Assistant** 🤖

100% Private | M1 Optimized | Voice Controlled
