# 🚀 RAGS AI - Complete Setup Guide

## ✅ PHASE 1 COMPLETE: Core Brain System

**What's Working:**
- ✅ Picovoice Porcupine Wake Word (Always-On)
- ✅ Whisper.cpp Local STT (Offline)
- ✅ ElevenLabs + Coqui TTS (Hybrid)
- ✅ Ollama Local LLM Brain (Offline AI)
- ✅ Persistent Memory System (Supabase + pgvector)
- ✅ Complete Voice Pipeline Integration

---

## 📋 Prerequisites

### 1. Install Ollama (Local AI Brain)
```bash
# macOS
brew install ollama

# Start Ollama server
ollama serve

# Pull fast model (in new terminal)
ollama pull llama3.2:latest
```

### 2. Install Whisper.cpp (Local STT)
```bash
# Clone whisper.cpp
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp

# Build
make

# Download model (base.en is fast and accurate)
bash ./models/download-ggml-model.sh base.en

# Copy binary to /usr/local/bin
sudo cp main /usr/local/bin/whisper

# Note the model path
echo "Model path: $(pwd)/models/ggml-base.en.bin"
```

### 3. Install Coqui TTS (Offline TTS Fallback)
```bash
pip install TTS
```

### 4. Get API Keys

**Required:**
- Picovoice Access Key: https://console.picovoice.ai/
- Supabase URL + Anon Key: https://supabase.com/

**Optional (for better quality):**
- ElevenLabs API Key: https://elevenlabs.io/

---

## 🔧 Installation

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment Variables
Create `backend/.env`:
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Picovoice
PICOVOICE_ACCESS_KEY=your_picovoice_key

# ElevenLabs (Optional)
ELEVENLABS_API_KEY=your_elevenlabs_key

# Whisper
WHISPER_CPP_PATH=/usr/local/bin/whisper
WHISPER_MODEL_PATH=/path/to/whisper.cpp/models/ggml-base.en.bin

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest

# Server
PORT=3000
```

### 3. Setup Supabase Database

Run this SQL in Supabase SQL Editor:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Memories table
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  importance INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  accessed_at TIMESTAMP DEFAULT NOW(),
  access_count INTEGER DEFAULT 0
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_memories_user ON memories(user_id);
CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_conversations_user_session ON conversations(user_id, session_id);

-- Semantic search function
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_threshold FLOAT,
  match_count INT,
  user_id_filter UUID
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  importance INTEGER,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    id,
    content,
    metadata,
    importance,
    1 - (embedding <=> query_embedding) AS similarity
  FROM memories
  WHERE user_id = user_id_filter
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
```

---

## 🎯 Usage

### Start RAGS Voice System

```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start Backend
cd backend
npm run dev
```

### Test Voice Pipeline

```bash
# In backend directory
npm run test:voice
```

This will:
1. ✅ Start wake word detection ("Hey RAGS")
2. ✅ Listen for your command
3. ✅ Transcribe with Whisper
4. ✅ Process with Ollama
5. ✅ Respond with TTS
6. ✅ Save to memory

---

## 🎤 Voice Commands Examples

Say **"Hey RAGS"** then:
- "What can you help me with?"
- "Remind me to workout at 6 PM"
- "What did we talk about yesterday?"
- "Create a new note about AI research"
- "What's my schedule for today?"

---

## 🧪 Testing Individual Components

### Test Wake Word
```bash
node -e "
const { WakeWordEngine } = require('./dist/services/wakeword-porcupine');
const ww = new WakeWordEngine({ accessKey: process.env.PICOVOICE_ACCESS_KEY });
ww.on('wakeword', () => console.log('Wake word detected!'));
ww.start();
"
```

### Test Whisper STT
```bash
node -e "
const { WhisperLocalSTT } = require('./dist/services/stt-whisper-local');
const stt = new WhisperLocalSTT({ modelPath: process.env.WHISPER_MODEL_PATH });
stt.initialize().then(() => {
  stt.transcribe('./test-audio.wav').then(result => {
    console.log('Transcription:', result.text);
  });
});
"
```

### Test Ollama
```bash
node -e "
const { OllamaBrain } = require('./dist/services/ollama-brain');
const brain = new OllamaBrain();
brain.chat('Hello! Who are you?').then(response => {
  console.log('RAGS:', response);
});
"
```

### Test TTS
```bash
node -e "
const { HybridTTS } = require('./dist/services/tts-hybrid');
const tts = new HybridTTS({ elevenLabsApiKey: process.env.ELEVENLABS_API_KEY });
tts.initialize().then(() => {
  tts.speak({ text: 'Hey bro, RAGS is ready!' }).then(audio => {
    require('fs').writeFileSync('test.mp3', audio);
    console.log('Audio saved to test.mp3');
  });
});
"
```

---

## 🔥 What's Next?

### PHASE 2: Desktop UI (JARVIS Style)
- Animated AI Orb
- Voice visualizer
- System controls
- Settings panel

### PHASE 3: System Automation
- App control (open/close apps)
- File operations
- System commands
- Clipboard management

### PHASE 4: Habit Tracking
- Daily routines
- Habit streaks
- Progress tracking
- Smart reminders

---

## 🐛 Troubleshooting

### Ollama not responding
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama
pkill ollama
ollama serve
```

### Whisper not found
```bash
# Check whisper binary
which whisper

# If not found, copy from whisper.cpp
sudo cp /path/to/whisper.cpp/main /usr/local/bin/whisper
```

### Wake word not detecting
```bash
# List audio devices
node -e "
const { PvRecorder } = require('@picovoice/pvrecorder-node');
console.log(PvRecorder.getAvailableDevices());
"

# Update device index in config
```

### Memory not working
```bash
# Check Supabase connection
curl -H "apikey: YOUR_ANON_KEY" "YOUR_SUPABASE_URL/rest/v1/memories"
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    RAGS AI SYSTEM                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🎤 Wake Word (Porcupine) → Always Listening           │
│           ↓                                             │
│  🎙️  STT (Whisper.cpp) → Offline Transcription         │
│           ↓                                             │
│  🧠 LLM (Ollama) → Local AI Brain                      │
│           ↓                                             │
│  💾 Memory (Supabase) → Persistent Context             │
│           ↓                                             │
│  🔊 TTS (ElevenLabs/Coqui) → Natural Voice             │
│           ↓                                             │
│  🔈 Speaker → Audio Output                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

**RAGS AI - Your Offline-First AI Operating System** 🚀

