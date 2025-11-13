# 🚀 RAGS AI - Complete Setup Guide (Hindi)

## 📋 Kya Kya Chahiye

### 1. Ollama Install Karo (Offline AI - Privacy ke liye)
```bash
# Install Ollama
brew install ollama

# Start Ollama server
ollama serve

# Download AI model (new terminal)
ollama pull llama3.2:latest
```

**Kyu chahiye?** 
- ✅ Sab data locally rahega (privacy)
- ✅ Internet ki zarurat nahi
- ✅ M1 Mac pe fast chalega
- ✅ Free hai!

---

### 2. Gemini API Key Lo (Online AI - Internet access ke liye)

**Step 1:** Google AI Studio pe jao
```
https://makersuite.google.com/app/apikey
```

**Step 2:** "Create API Key" pe click karo

**Step 3:** API key copy karo (aise dikhega):
```
AIzaSyD...your_key_here...xyz123
```

**Kyu chahiye?**
- ✅ Latest news, weather, search kar sakta hai
- ✅ Internet se information le sakta hai
- ✅ Free tier hai (60 requests/minute)
- ✅ Privacy: Sirf jab zarurat ho tab use hoga

---

### 3. Environment Setup Karo

**Backend folder mein `.env` file banao:**

```bash
cd backend
cp .env.example .env
nano .env  # ya koi bhi editor use karo
```

**`.env` file mein ye daalo:**

```bash
# ============================================
# AI SERVICES
# ============================================

# Gemini API Key (Online AI)
GEMINI_API_KEY=AIzaSyD...tumhara_key_yaha_paste_karo...xyz123

# Ollama (Offline AI)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest

# AI Mode: "hybrid" (dono use karo), "gemini" (sirf online), "ollama" (sirf offline)
AI_MODE=hybrid

# ============================================
# PRIVACY SETTINGS
# ============================================

# Sab data locally store karo (cloud mein nahi)
PRIVACY_MODE=true

# Telemetry band karo
TELEMETRY_ENABLED=false

# ============================================
# DATABASE (Local Storage)
# ============================================

# Supabase OPTIONAL hai - local storage ke liye khali chhod do
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Local database path
LOCAL_DB_PATH=./data/rags.db

# ============================================
# SERVER
# ============================================

PORT=3000
NODE_ENV=development

# ============================================
# MAC SYSTEM ACCESS
# ============================================

SYSTEM_ACCESS_ENABLED=true
ALLOWED_ACTIONS=open_app,search_files,run_command,control_music

# ============================================
# VOICE SETTINGS
# ============================================

VOICE_SPEED=1.1
VOICE_LANG=hi-IN

# ============================================
# M1 OPTIMIZATION
# ============================================

USE_M1_OPTIMIZATION=true
MAX_CONCURRENT_REQUESTS=10
CACHE_SIZE_MB=500
```

---

## 🎯 Kaise Kaam Karega?

### Hybrid Mode (Recommended) ✅

**Privacy First:**
1. Pehle **Ollama** (offline) use karega
2. Agar internet chahiye (news, weather) → **Gemini** use karega
3. Sab data **locally** save hoga

**Example:**

```
Tum: "Hello RAGS"
→ Ollama (offline) respond karega
→ Privacy: ✅ Data laptop mein hi rahega

Tum: "Aaj ka weather kaisa hai?"
→ Gemini (online) use karega
→ Latest weather batayega

Tum: "2 + 2 kitna hota hai?"
→ Ollama (offline) respond karega
→ Privacy: ✅ Data laptop mein hi rahega
```

---

## 🚀 Kaise Chalaye?

### Step 1: Ollama Start Karo (Terminal 1)
```bash
ollama serve
```

**Output dikhega:**
```
Listening on 127.0.0.1:11434
```

### Step 2: Backend Start Karo (Terminal 2)
```bash
cd backend
npm run dev
```

**Output dikhega:**
```
✅ Ollama initialized (offline AI)
✅ Gemini initialized (online AI)
🚀 RAGS AI Backend running on port 3000
```

### Step 3: Desktop App Start Karo (Terminal 3)
```bash
cd desktop
npm run dev
```

**Output dikhega:**
```
➜  Local:   http://localhost:1420/
```

### Step 4: Browser Mein Kholo
```
http://localhost:1420/
```

---

## 🎤 Test Karo

### Voice Commands Try Karo:

1. **Power button** click karo (top left)
2. **Mic button** click karo
3. Bolo:

```
"Hello RAGS"
→ Response: "नमस्ते! मैं रैग्स हूँ..."

"What time is it?"
→ Response: "अभी 3:45 बज रहे हैं"

"2 plus 2"
→ Response: "जवाब है 4"

"Tell me about Python"
→ Response: "पाइथन बहुत पॉपुलर है..."

"Aaj ka weather kaisa hai?"
→ Response: [Gemini se latest weather]
```

---

## 🔒 Privacy Kaise Kaam Karti Hai?

### Local Storage (Recommended) ✅

**Sab kuch laptop mein:**
```
/Users/raghavpratap/Desktop/RAGS.V1/backend/data/
├── rags.db          # Tumhari conversations
├── cache/           # Voice recordings (temporary)
└── user-data/       # Settings, preferences
```

**Kya store hota hai:**
- ✅ Tumhari conversations
- ✅ Voice recordings (temporary)
- ✅ Settings & preferences
- ✅ Chat history

**Kya NAHI hota:**
- ❌ Cloud mein upload
- ❌ Google/Microsoft ko data
- ❌ Internet pe share
- ❌ Kisi server pe save

### Privacy Modes:

**1. Full Privacy (Ollama Only)**
```bash
AI_MODE=ollama
PRIVACY_MODE=true
```
→ Sab kuch offline, kuch bhi internet pe nahi jayega

**2. Hybrid (Smart)**
```bash
AI_MODE=hybrid
PRIVACY_MODE=true
```
→ Offline first, sirf zarurat pe online

**3. Online (Gemini Only)**
```bash
AI_MODE=gemini
PRIVACY_MODE=false
```
→ Hamesha internet use karega

---

## 📊 Status Check Karo

### Backend Status:
```bash
curl http://localhost:3000/api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "ai": {
    "ollama": "available",
    "gemini": "available",
    "mode": "hybrid"
  },
  "privacy": {
    "mode": "enabled",
    "storage": "local"
  }
}
```

---

## 🎨 3D Face Feature (Coming Next!)

**Kya hoga:**
- ✅ Modern 3D animated face
- ✅ Emotions (happy, sad, thinking)
- ✅ Eyebrow movements
- ✅ Eye blinking & tracking
- ✅ Lip sync with voice
- ✅ Smooth animations

**Abhi kya hai:**
- ✅ 3D orb with pulse animation
- ✅ Voice visualization
- ✅ Smooth transitions

---

## 🐛 Problems?

### Ollama nahi chal raha?
```bash
# Check if running
curl http://localhost:11434/api/tags

# Restart
killall ollama
ollama serve
```

### Gemini error?
```bash
# Check API key
echo $GEMINI_API_KEY

# Test API
curl https://generativelanguage.googleapis.com/v1/models?key=YOUR_KEY
```

### Backend crash?
```bash
# Check logs
cd backend
npm run dev

# Clear cache
rm -rf cache/* temp/*
```

### White screen?
```bash
# Clear browser cache
# Restart desktop app
cd desktop
npm run dev
```

---

## 📈 Performance (M1 Mac)

**Ollama (Offline):**
- Response time: 1-2 seconds
- Memory: ~2GB
- CPU: Optimized for M1

**Gemini (Online):**
- Response time: 2-4 seconds
- Memory: ~100MB
- Internet: Required

**Hybrid:**
- Best of both worlds
- Smart routing
- Fast & accurate

---

## ✅ Summary

**Setup Steps:**
1. ✅ Ollama install karo → `brew install ollama`
2. ✅ Gemini API key lo → https://makersuite.google.com/app/apikey
3. ✅ `.env` file banao → API key paste karo
4. ✅ Ollama start karo → `ollama serve`
5. ✅ Backend start karo → `npm run dev`
6. ✅ Desktop start karo → `npm run dev`
7. ✅ Test karo → Voice commands try karo

**Privacy:**
- ✅ Sab data locally
- ✅ No cloud upload
- ✅ Full control

**Features:**
- ✅ Voice recognition
- ✅ AI responses (offline + online)
- ✅ Camera integration
- ✅ Mac system access
- ✅ Beautiful UI

**Ready!** 🎉

---

Koi problem? Batao! 😊

