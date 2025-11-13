# 🤖 RAGS AI - Complete Setup Instructions

## 🚀 Quick Start (5 Minutes)

### 1. Run Setup Script
```bash
cd RAGS.V1
./setup-complete-rags.sh
```

### 2. Add API Keys
Edit `backend/.env` and add:
```bash
PICOVOICE_ACCESS_KEY=your_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
ELEVENLABS_API_KEY=your_elevenlabs_key  # Optional
```

### 3. Start RAGS
```bash
cd backend
npm run rags
```

### 4. Activate Voice Control
Say **"Hey RAGS"** and start talking!

---

## 🎯 What RAGS Can Do

### 🎤 Voice Control
- Always listening for "Hey RAGS"
- Natural Hindi/English conversation
- Offline speech processing

### 🖥️ Mac Control
- Open/close applications
- Take screenshots
- Control volume/brightness
- File management
- System automation

### 🔍 Research & Knowledge
- Web search and research
- Quick fact lookup
- Information storage in memory
- Learning from conversations

### 👁️ Vision System
- Camera access and photos
- Screen reading (OCR)
- User presence detection
- Visual monitoring

### 🧠 Memory & Learning
- Remembers all conversations
- Learns your preferences
- Builds user profile
- Semantic search

---

## 🎙️ Voice Commands Examples

### System Control
- "Hey RAGS, open Chrome"
- "Take a screenshot"
- "Set volume to 50"
- "Lock the screen"

### Research
- "Research artificial intelligence"
- "What is quantum computing?"
- "Tell me about latest iPhone"

### Vision
- "Take a photo"
- "What's on my screen?"
- "Read the screen text"

### Personal
- "Remember that I like coffee"
- "What did we talk about yesterday?"
- "Set a reminder for 3 PM"

---

## 🔧 Troubleshooting

### Ollama Not Running
```bash
brew services start ollama
ollama serve
```

### Whisper Not Found
```bash
which whisper
# If not found, reinstall whisper.cpp
```

### Microphone Issues
- Check System Preferences > Security & Privacy > Microphone
- Grant permissions to Terminal/iTerm

### Camera/Screen Access
- Check System Preferences > Security & Privacy > Camera
- Check System Preferences > Security & Privacy > Screen Recording

---

## 📊 System Status

RAGS will show you:
- 🔋 Battery level
- 📶 WiFi status
- 🎤 Voice system status
- 🧠 Memory count
- 📱 Running apps

---

## 🛑 Stopping RAGS

Press `Ctrl+C` or say "Hey RAGS, shutdown"

---

## 🎉 Welcome Experience

When you first activate RAGS:

1. **Welcome Message**: RAGS will greet you in Hinglish
2. **Name Setup**: Will ask for your name if first time
3. **Capability Demo**: Will explain what it can do
4. **Ready to Help**: Will ask how it can assist you

---

## 🔒 Privacy & Security

- **100% Offline**: All AI processing happens locally
- **No Data Sharing**: Your conversations stay on your Mac
- **Local Storage**: Memory stored in local Supabase
- **Secure**: No external API calls for core functions

---

## 📈 Advanced Features

### Continuous Learning
- RAGS learns from every conversation
- Builds detailed user profile
- Remembers preferences and habits
- Improves responses over time

### Proactive Assistance
- Monitors system health
- Suggests optimizations
- Reminds about important tasks
- Provides contextual help

### Multi-Modal Intelligence
- Voice + Vision + Text
- Screen understanding
- Camera-based interactions
- Gesture recognition (future)

---

## 🎯 Next Steps

After setup, try:

1. **Basic Conversation**: "Hey RAGS, how are you?"
2. **System Control**: "Open Spotify and play music"
3. **Research**: "Research the latest AI developments"
4. **Personal**: "Remember that I'm working on a project"
5. **Vision**: "Take a photo and describe what you see"

---

**RAGS AI is now your complete offline AI companion!** 🚀

Enjoy your personal JARVIS experience! 🤖✨