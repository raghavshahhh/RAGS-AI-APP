# 🚀 RAGS V1 - Quick Start Guide (After Fixes)

## ✅ All Features Working Now!

RAGS ko ab complete kar diya hai! Ab sab kuch properly work karega.

---

## 📋 Prerequisites Check

```bash
# Check Node.js
node --version  # Should be 18+

# Check Ollama
ollama --version  # For AI

# Check if backend dependencies are installed
cd backend
ls node_modules  # Should have folders

# Check if desktop dependencies are installed
cd ../desktop
ls node_modules  # Should have folders
```

---

## 🎯 Starting RAGS (3 Easy Steps)

### Step 1: Start Ollama (AI Brain)
```bash
# Open Terminal 1
ollama serve

# Keep this running in background
# You should see: "Listening on 127.0.0.1:11434"
```

### Step 2: Start Backend (API Server)
```bash
# Open Terminal 2
cd /Users/raghavpratap/Desktop/RAGS.V1/backend
npm run dev

# You should see:
# 🚀 RAGS AI Backend running on port 3000
# 📝 Environment: development
# 🔗 API URL: http://localhost:3000
# 🔌 WebSocket URL: ws://localhost:3000
```

### Step 3: Start Desktop (UI)
```bash
# Open Terminal 3
cd /Users/raghavpratap/Desktop/RAGS.V1/desktop
npm run dev

# Browser will open automatically at http://localhost:5173
```

---

## 🧪 Testing All Features

### 1. Test Chat ✅
1. Click **Chat** button (blue icon)
2. Type: "Hello, who are you?"
3. Press Enter
4. You should get AI response

**Expected**: AI responds with Ollama

### 2. Test Notes ✅
1. Click **Notes** button (purple icon)
2. Click **New Note**
3. Edit title: "Test Note"
4. Edit content: "This is a test"
5. Click **Edit**, then **Save**

**Expected**: Note saved successfully

### 3. Test Reminders ✅
1. Click **Reminders** button (orange icon)
2. Click **Create New Reminder**
3. Fill details:
   - Title: "Test Reminder"
   - Date: Tomorrow
   - Priority: Medium
4. Click **Create Reminder**

**Expected**: Reminder created

### 4. Test Browser Control ✅
1. Click **Browser** button (globe icon)
2. Click **Start Browser** (first time only)
3. Enter URL: "google.com"
4. Click **Go**
5. Try **Scroll Down**
6. Try **Capture Screenshot**

**Expected**: Browser automation works

### 5. Test System Monitor ✅
1. Click **Monitor** button (activity icon)
2. Check server status (should be "running")
3. Check memory usage
4. Check WebSocket clients

**Expected**: Real-time stats displayed

### 6. Test Voice Control ✅
1. Click microphone button at bottom
2. Say: "Hello RAGS"
3. Wait for response

**Expected**: Voice transcription + AI response

### 7. Test Automate Panel
1. Click **Automate** button (lightning icon)
2. See existing automations
3. Toggle automation on/off

### 8. Test Settings
1. Click **Settings** button (gear icon)
2. View current settings
3. Save changes if needed

---

## 🎤 Voice Commands to Test

### Basic Commands
- "Hello RAGS"
- "What time is it?"
- "Tell me a joke"
- "Who created you?"

### Browser Commands
- "Open google.com"
- "Search for AI news"
- "Scroll down"
- "Take a screenshot"

### Notes Commands
- "Create a note"
- "Show my notes"
- "Remember this: I love coding"

### Reminder Commands
- "Remind me to drink water in 10 minutes"
- "Show my reminders"
- "Set a reminder for tomorrow"

---

## 🐛 Troubleshooting

### Issue 1: Backend Not Starting
```bash
# Solution 1: Kill existing process
lsof -ti:3000 | xargs kill -9

# Solution 2: Check Ollama
ollama list  # Should show models
ollama pull phi3:mini  # If model missing

# Solution 3: Check environment
cd backend
cat .env  # Should have OLLAMA_MODEL=phi3:mini
```

### Issue 2: Desktop Shows "Backend Not Available"
```bash
# Check backend is running
curl http://localhost:3000/health

# Should return JSON with status: "healthy"
# If not, restart backend
```

### Issue 3: Voice Not Working
```bash
# Check browser permissions
# Chrome/Edge: Settings > Privacy > Microphone
# Allow access for localhost

# Check console (F12)
# Look for microphone permission errors
```

### Issue 4: Panels Not Opening
```bash
# Check console for errors (F12)
# Common fix: Clear browser cache
# Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Issue 5: Notes/Reminders Empty
```bash
# This is normal! Backend uses local storage
# No Supabase needed - data is in backend/data/
# Create new notes/reminders to test
```

---

## 📊 API Health Check

Test all endpoints manually:

```bash
# 1. Health Check
curl http://localhost:3000/health

# 2. System Status
curl http://localhost:3000/api/v1/status

# 3. AI Status
curl http://localhost:3000/api/real-ai/status

# 4. Initialize AI
curl -X POST http://localhost:3000/api/real-ai/initialize \
  -H "Content-Type: application/json" \
  -d '{"userId": "test123"}'

# 5. Test Chat
curl -X POST http://localhost:3000/api/real-ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# All should return JSON responses
```

---

## 🎯 Expected Behavior

### When Everything Works:

#### Dashboard
- 8 beautiful buttons with gradients
- Hover effects work smoothly
- Click opens respective panel

#### Voice Control
- Microphone button at bottom
- Click to start listening
- Green "Listening" indicator shows
- Speech converts to text in real-time
- AI responds with voice

#### Panels
- Open with smooth animation
- Click outside to close
- Press Escape to close
- Multiple panels can be open

#### System Monitor
- Shows real data from backend
- Auto-refreshes every 5 seconds
- Memory usage bar animates
- All services show status

---

## 🔥 Performance Tips

### Tip 1: Keep Ollama Running
```bash
# Don't restart Ollama frequently
# Just keep it running in background
# Faster responses when warm
```

### Tip 2: Browser Automation
```bash
# Initialize once per session
# Reuse same browser instance
# Faster automation after first time
```

### Tip 3: Backend Caching
```bash
# Backend caches AI responses
# Repeat questions = instant answers
# Cache stored in backend/cache/
```

---

## 📱 Features Summary

| Feature | Status | Button | API Endpoint |
|---------|--------|--------|--------------|
| Chat | ✅ Working | 💬 Blue | `/api/real-ai/chat` |
| Notes | ✅ Working | 📝 Purple | `/api/v1/notes` |
| Reminders | ✅ Working | 🔔 Orange | `/api/v1/reminders` |
| Automate | ✅ Working | ⚡ Yellow | `/api/autopilot/*` |
| Browser | ✅ Working | 🌐 Blue | `/api/browser-control/*` |
| Monitor | ✅ Working | 📊 Green | `/api/v1/status` |
| Schedule | ✅ Working | 📅 Teal | `/api/v1/reminders` |
| Settings | ✅ Working | ⚙️ Purple | localStorage |

---

## 🎬 Demo Scenario

Complete workflow to test everything:

```
1. Start RAGS (all 3 terminals)
2. Click "Chat" - Say hello to AI
3. Click "Notes" - Create a note about today
4. Click "Reminders" - Set reminder for lunch
5. Click "Browser" - Open google.com
6. Click "Monitor" - Check system stats
7. Use Voice - Say "what's the weather?"
8. Click "Settings" - View configuration
```

**Time to complete**: ~3 minutes
**Expected result**: All features work perfectly!

---

## 🚀 Ready to Go!

Ab RAGS completely ready hai. Sab features backend se connected hain aur properly work kar rahe hain.

### Quick Launch:
```bash
# One command to rule them all! 😎
cd /Users/raghavpratap/Desktop/RAGS.V1 && ./scripts/start-all.sh
```

---

## 🎯 Enjoy RAGS!

Ab tum:
- ✅ AI se baat kar sakte ho
- ✅ Notes bana sakte ho
- ✅ Reminders set kar sakte ho
- ✅ Browser control kar sakte ho
- ✅ System monitor kar sakte ho
- ✅ Voice commands use kar sakte ho
- ✅ Sab kuch real-time hai!

**RAGS is now a REAL AI Operating System! 🎉**
