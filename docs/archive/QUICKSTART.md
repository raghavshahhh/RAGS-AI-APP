# ⚡ RAGS AI - Quick Start (5 Minutes)

## 🎯 Goal
Get RAGS voice system running in 5 minutes!

---

## Step 1: Install Ollama (2 min)

```bash
# macOS
brew install ollama

# Start Ollama (keep this terminal open)
ollama serve
```

**In a NEW terminal:**
```bash
# Pull fast model (3B parameters, runs on any Mac)
ollama pull llama3.2:latest
```

---

## Step 2: Install Whisper.cpp (2 min)

```bash
# Clone and build
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
make

# Download model
bash ./models/download-ggml-model.sh base.en

# Install binary
sudo cp main /usr/local/bin/whisper
```

**Save this path** (you'll need it):
```bash
pwd
# Example: /Users/raghavpratap/whisper.cpp
```

---

## Step 3: Get API Keys (1 min)

### Required:
1. **Picovoice** (Free): https://console.picovoice.ai/
   - Sign up → Get Access Key

2. **Supabase** (Free): https://supabase.com/
   - New Project → Copy URL + Anon Key

### Optional (for better quality):
3. **ElevenLabs** (Free tier): https://elevenlabs.io/

---

## Step 4: Setup Backend (30 sec)

```bash
cd /Users/raghavpratap/Desktop/RAGS.V1/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

**Edit `.env`** and add your keys:
```env
# Required
PICOVOICE_ACCESS_KEY=your_key_here
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your_key_here
WHISPER_MODEL_PATH=/Users/raghavpratap/whisper.cpp/models/ggml-base.en.bin

# Optional
ELEVENLABS_API_KEY=your_key_here
```

---

## Step 5: Setup Supabase Database (30 sec)

1. Go to your Supabase project
2. Click **SQL Editor**
3. Copy-paste this:

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Memories table
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
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
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_memories_user ON memories(user_id);
CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_conversations_user_session ON conversations(user_id, session_id);

-- Search function
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

4. Click **Run**

---

## Step 6: Test Voice System! 🎤

```bash
cd /Users/raghavpratap/Desktop/RAGS.V1/backend

# Make sure Ollama is running in another terminal!
# Then run:
npm run test:voice
```

**You should see:**
```
🧪 Testing RAGS Voice Pipeline...
✅ Voice pipeline ready!
🎤 Say "Hey RAGS" to activate...
```

**Now say:** "Hey RAGS"

Then say something like:
- "What can you help me with?"
- "Tell me a joke"
- "What's the weather like?"

---

## 🎉 Success!

If you see:
```
🔥 Wake word detected!
👂 Listening for your command...
📝 You said: "..."
🧠 Processing with AI...
💬 RAGS: "..."
🔊 Speaking response...
✅ Interaction complete!
```

**CONGRATULATIONS!** RAGS is working! 🚀

---

## 🐛 Troubleshooting

### "Ollama is not running"
```bash
# In a separate terminal:
ollama serve
```

### "Whisper not found"
```bash
# Check if installed:
which whisper

# If not found:
cd whisper.cpp
sudo cp main /usr/local/bin/whisper
```

### "Picovoice error"
- Check your access key in `.env`
- Make sure microphone permissions are granted

### "Supabase error"
- Check URL and keys in `.env`
- Make sure you ran the SQL script

---

## 🚀 What's Next?

### Test Desktop UI
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1/desktop
npm run dev
```

### Test Mobile App (iOS Simulator)
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1/mobile
npm run ios
```

### Start Full Backend Server
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1/backend
npm run dev
```

---

## 📚 Learn More

- **Full Setup Guide**: See `SETUP_GUIDE.md`
- **API Documentation**: See `API_DOCS.md` (coming soon)
- **Architecture**: See `ARCHITECTURE.md` (coming soon)

---

**RAGS AI - Your Offline-First AI Operating System** 🔥

