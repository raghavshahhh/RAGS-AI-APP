# 🤖 Ollama Setup Guide - Offline AI for RAGS

## ✅ Kya Hai Ollama?

Ollama ek **offline AI** hai jo tumhare Mac pe locally chalti hai:
- ✅ **100% Privacy** - Sab data laptop mein
- ✅ **No Internet** - Offline kaam karti hai
- ✅ **Free** - Koi paisa nahi
- ✅ **M1 Optimized** - Apple Silicon ke liye fast
- ✅ **Multiple Models** - Llama, Mistral, etc.

---

## 🚀 Installation

### Step 1: Install Ollama

```bash
# Homebrew se install karo
brew install ollama
```

**Alternative (Manual):**
```bash
# Download from website
curl -fsSL https://ollama.com/install.sh | sh
```

### Step 2: Verify Installation

```bash
# Check version
ollama --version

# Should show: ollama version 0.x.x
```

---

## 📥 Download AI Models

### Recommended Model: Llama 3.2 (Best for RAGS)

```bash
# Download Llama 3.2 (3GB)
ollama pull llama3.2:latest
```

**Why Llama 3.2?**
- ✅ Fast on M1 Mac
- ✅ Good Hindi/English support
- ✅ Small size (3GB)
- ✅ Smart responses

### Other Models (Optional):

```bash
# Llama 3.2 1B (Fastest, 1GB)
ollama pull llama3.2:1b

# Llama 3.2 3B (Balanced, 3GB)
ollama pull llama3.2:3b

# Mistral (Alternative, 4GB)
ollama pull mistral:latest

# Gemma 2 (Google's model, 2GB)
ollama pull gemma2:2b
```

---

## 🎯 Start Ollama Server

### Terminal 1: Start Server

```bash
ollama serve
```

**Output:**
```
Listening on 127.0.0.1:11434 (version 0.x.x)
```

**Keep this terminal running!** ⚠️

---

## 🧪 Test Ollama

### Test 1: List Models

```bash
ollama list
```

**Output:**
```
NAME              ID              SIZE      MODIFIED
llama3.2:latest   abc123def456    3.2 GB    2 minutes ago
```

### Test 2: Chat Test

```bash
ollama run llama3.2:latest
```

**Try:**
```
>>> Hello, who are you?
I'm Llama, an AI assistant...

>>> 2 + 2 kitna hota hai?
2 + 2 = 4 hota hai.

>>> /bye
```

### Test 3: API Test

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:latest",
  "prompt": "Hello RAGS",
  "stream": false
}'
```

---

## ⚙️ Configure RAGS to Use Ollama

### Update `.env` file:

```bash
cd backend
nano .env
```

**Add/Update:**
```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest

# AI Mode
AI_MODE=hybrid  # or "ollama" for offline-only

# Privacy Mode
PRIVACY_MODE=true
```

### Restart Backend:

```bash
cd backend
npm run dev
```

**Look for:**
```
✅ Ollama initialized (offline AI)
🚀 RAGS AI Backend running on port 3000
```

---

## 🎯 Usage in RAGS

### Automatic Mode (Hybrid):

```
User: "Hello RAGS"
→ Uses Ollama (offline) ✅

User: "What's the weather today?"
→ Uses Gemini (online) ✅

User: "2 + 2 = ?"
→ Uses Ollama (offline) ✅
```

### Offline-Only Mode:

```bash
# In .env
AI_MODE=ollama
PRIVACY_MODE=true
```

```
User: "Hello RAGS"
→ Uses Ollama (offline) ✅

User: "What's the weather?"
→ Uses Ollama (offline, no internet) ✅
```

---

## 🔧 Advanced Configuration

### Change Model:

```bash
# In .env
OLLAMA_MODEL=mistral:latest
```

### Multiple Models:

```bash
# Download multiple
ollama pull llama3.2:latest
ollama pull mistral:latest
ollama pull gemma2:2b

# Switch in .env
OLLAMA_MODEL=mistral:latest
```

### Performance Tuning:

```bash
# In .env
USE_M1_OPTIMIZATION=true
MAX_CONCURRENT_REQUESTS=10
CACHE_SIZE_MB=500
```

---

## 📊 Performance (M1 Mac)

### Llama 3.2 (3B):
- **First response:** ~2 seconds
- **Subsequent:** ~1 second
- **Memory:** ~2GB RAM
- **CPU:** 20-40% (optimized)

### Llama 3.2 (1B):
- **First response:** ~1 second
- **Subsequent:** ~0.5 seconds
- **Memory:** ~1GB RAM
- **CPU:** 10-20%

---

## 🐛 Troubleshooting

### Issue 1: "Connection refused"

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve
```

### Issue 2: "Model not found"

```bash
# List models
ollama list

# Pull model
ollama pull llama3.2:latest
```

### Issue 3: Slow responses

```bash
# Use smaller model
ollama pull llama3.2:1b

# Update .env
OLLAMA_MODEL=llama3.2:1b
```

### Issue 4: High memory usage

```bash
# Stop Ollama
killall ollama

# Restart with smaller model
ollama serve
ollama pull llama3.2:1b
```

---

## 🎯 Best Practices

### 1. Keep Ollama Running

```bash
# Add to startup (optional)
brew services start ollama
```

### 2. Use Hybrid Mode

```bash
AI_MODE=hybrid  # Best of both worlds
```

### 3. Monitor Performance

```bash
# Check memory
top -pid $(pgrep ollama)

# Check models
ollama list
```

### 4. Update Regularly

```bash
# Update Ollama
brew upgrade ollama

# Update models
ollama pull llama3.2:latest
```

---

## 🔒 Privacy Benefits

### With Ollama:
- ✅ All conversations stay on Mac
- ✅ No data sent to internet
- ✅ No API keys needed
- ✅ No usage limits
- ✅ Complete control

### Without Ollama:
- ⚠️ Needs Gemini API (internet)
- ⚠️ Data sent to Google
- ⚠️ Rate limits apply
- ⚠️ Requires API key

---

## 📈 Comparison

| Feature | Ollama | Gemini |
|---------|--------|--------|
| Privacy | ✅ 100% Local | ⚠️ Cloud |
| Internet | ❌ Not needed | ✅ Required |
| Speed | ✅ Fast (1-2s) | ⚠️ Slower (2-4s) |
| Cost | ✅ Free | ✅ Free (limited) |
| Latest Info | ❌ No | ✅ Yes |
| Knowledge | ✅ Good | ✅ Excellent |

**Best:** Use both in hybrid mode! 🎯

---

## ✅ Quick Start Checklist

- [ ] Install Ollama: `brew install ollama`
- [ ] Start server: `ollama serve`
- [ ] Download model: `ollama pull llama3.2:latest`
- [ ] Test: `ollama run llama3.2:latest`
- [ ] Configure `.env`: Set `OLLAMA_MODEL=llama3.2:latest`
- [ ] Set mode: `AI_MODE=hybrid`
- [ ] Enable privacy: `PRIVACY_MODE=true`
- [ ] Restart backend: `npm run dev`
- [ ] Test RAGS: Say "Hello RAGS"

---

## 🎉 Done!

Ollama ab ready hai! RAGS ab offline bhi kaam karega! 🚀

**Next:** Read `SETUP_GUIDE_HINDI.md` for complete setup.

