# RAGS AI - Quick Start Guide (After Improvements)

## 🚀 Quick Setup

### 1. **Install Dependencies**

```bash
# Backend
cd backend
npm install

# Desktop
cd ../desktop
npm install

# Mobile (optional)
cd ../mobile
npm install
```

### 2. **Start Ollama** (Required for AI)

```bash
# Start Ollama server
ollama serve

# In another terminal, pull model
ollama pull phi3:mini
```

### 3. **Configure Environment**

```bash
cd backend
cp .env.example .env

# Edit .env and set:
# OLLAMA_MODEL=phi3:mini
# PORT=3000
```

### 4. **Start Services**

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Desktop
cd desktop
npm run tauri:dev

# Terminal 3: Mobile (optional)
cd mobile
npm start
```

---

## ✅ Verify Everything Works

### Backend Health Check
```bash
# Basic health
curl http://localhost:3000/health

# Detailed status
curl http://localhost:3000/api/v1/status
```

Expected Response:
```json
{
  "status": "healthy",
  "uptime": 42.5,
  "services": {
    "api": "operational",
    "websocket": "operational",
    "connectedClients": 1
  }
}
```

### Test AI Chat
```bash
curl -X POST http://localhost:3000/api/real-ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello RAGS"}'
```

Expected: AI response within 1-3 seconds (first time), 0.1-0.5s (cached)

### Test WebSocket (if wscat installed)
```bash
# Install wscat
npm install -g wscat

# Test connection
wscat -c ws://localhost:3000
# Type: {"type":"ping"}
# Should receive: {"type":"pong","timestamp":"..."}
```

---

## 📊 New Features to Try

### 1. **Response Caching**
Ask the same question twice:
```bash
# First time (slow)
time curl -X POST http://localhost:3000/api/real-ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is 2+2?"}'

# Second time (instant - cached!)
time curl -X POST http://localhost:3000/api/real-ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is 2+2?"}'
```

### 2. **Local Memory System**
The memory system automatically stores conversations:
```bash
# Check if memory directory exists
ls -la data/memory/user1/

# View stored memories
cat data/memory/user1/memories.json | jq .

# View conversations
cat data/memory/user1/conversations.json | jq .
```

### 3. **Auto-Reconnect (Desktop)**
1. Open desktop app
2. See green connection indicator
3. Stop backend (Ctrl+C)
4. See red indicator and "reconnecting..." message
5. Restart backend
6. Watch it auto-reconnect!

### 4. **Request Retry**
Test automatic retry:
```bash
# Stop Ollama
pkill ollama

# Try to chat (will retry 3 times)
curl -X POST http://localhost:3000/api/real-ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# You'll see retry attempts in backend logs:
# ⚠️ Ollama chat failed (attempt 1/3), retrying in 1000ms...
# ⚠️ Ollama chat failed (attempt 2/3), retrying in 2000ms...
# ⚠️ Ollama chat failed (attempt 3/3), retrying in 4000ms...

# Restart Ollama
ollama serve
```

### 5. **Persistence (Desktop)**
1. Open desktop app
2. Send some messages
3. Change a setting
4. Close app
5. Reopen app
6. Messages and settings are still there! ✨

---

## 🧪 Run All Tests

```bash
# Make script executable
chmod +x TEST_ALL_IMPROVEMENTS.sh

# Run all tests
./TEST_ALL_IMPROVEMENTS.sh
```

You should see:
```
✓ Backend Health
✓ API Endpoints  
✓ WebSocket Connection
✓ Memory System
✓ File Structure
✓ Dependencies

🎉 All tests passed!
```

---

## 📱 Desktop App Features

### Connection Status
- **Green dot**: Connected to backend
- **Red dot**: Disconnected
- **Yellow dot**: Reconnecting

### Voice Input
- Press microphone button or `Cmd/Ctrl + Space`
- Speak your command
- See real-time transcription
- Get AI response with voice

### Chat Panel
- Click "Chat" or press `Cmd/Ctrl + K`
- View conversation history (last 100 messages)
- Messages auto-save
- Scroll to see older messages

### Settings
- Theme: Dark/Light
- Volume control
- Enable/disable voice
- Enable/disable camera
- Enable/disable notifications

---

## 📱 Mobile App Features

### Voice Recording
- Tap microphone button
- Speak for up to 5 seconds
- Auto-stop and process
- See AI response

### Camera Capture
- Tap camera icon
- Take photo
- Photo sent to backend for analysis
- Get AI description

### Connection Status
- Green: Connected to backend
- Red: Offline mode
- Automatic retry every 10s

---

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Ollama not responding
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama
pkill ollama
ollama serve

# Check model is pulled
ollama list
```

### Desktop app won't connect
1. Check backend is running: `curl http://localhost:3000/health`
2. Check firewall settings
3. Check .env file has correct PORT
4. Restart desktop app

### Mobile app can't connect
1. Backend must be on same network
2. Use computer's IP instead of localhost
3. Update API URL in mobile code:
   ```typescript
   // Change from
   const API_URL = 'http://localhost:3000';
   // To
   const API_URL = 'http://192.168.1.XXX:3000';
   ```

### Memory not saving
```bash
# Check directory permissions
ls -la data/memory/

# Create directory manually if needed
mkdir -p data/memory/user1

# Check backend logs for errors
# Should see: ✅ Memory file exists
```

---

## 💡 Performance Tips

### 1. Use Smaller Model for Speed
```bash
# Current model (balanced)
OLLAMA_MODEL=phi3:mini

# Faster but less accurate
OLLAMA_MODEL=phi3:3.8b

# Slower but more accurate
OLLAMA_MODEL=llama3.2:3b
```

### 2. Adjust Cache Settings
Edit `backend/src/services/ollama-brain.ts`:
```typescript
// Increase cache size for more hits
if (this.responseCache.size > 500) { // default: 100

// Longer cache TTL
const cached = this.getCachedResponse(key, 7200000); // 2 hours instead of 1
```

### 3. Reduce Context Window
```typescript
// Fewer messages = faster response
const recentHistory = this.conversationHistory.slice(-4); // default: -6
```

### 4. Optimize Token Limit
```typescript
num_predict: 50, // Shorter responses (default: 100)
```

---

## 📊 Monitor Performance

### View System Status
```bash
curl http://localhost:3000/api/v1/status | jq .
```

Response includes:
- Memory usage (MB)
- CPU usage
- Uptime
- WebSocket clients
- Database status

### View Logs
```bash
# Backend logs
cd backend
npm run dev

# Watch for:
# 💾 Cache hit (hits: 5)  ← Caching working
# 📤 Sending 6 messages    ← Context window size
# ✅ Response generated    ← Success
# ⚠️ Retry attempt         ← Network issues
```

### Memory Statistics
```typescript
// In backend code
const stats = await memory.getStats();
console.log({
  totalMemories: stats.totalMemories,
  totalConversations: stats.totalConversations,
  averageImportance: stats.averageImportance
});
```

---

## 🎯 Usage Examples

### Example 1: Basic Chat
```bash
curl -X POST http://localhost:3000/api/real-ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me a joke"}'
```

### Example 2: Remember Information
```bash
curl -X POST http://localhost:3000/api/real-ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Remember that I like pizza"}'

# Later...
curl -X POST http://localhost:3000/api/real-ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What food do I like?"}'
```

### Example 3: Camera Vision
```bash
curl -X POST http://localhost:3000/api/camera-vision/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What do you see?"}'
```

### Example 4: Browser Control
```bash
curl -X POST http://localhost:3000/api/browser-control/click \
  -H "Content-Type: application/json" \
  -d '{"target": "button.submit"}'
```

---

## 🔐 Security Notes

- Backend runs on `http://localhost:3000` by default
- For production, use HTTPS and proper authentication
- API keys should be in `.env`, never commit to git
- Memory files contain user data, keep them secure

---

## 📚 Next Steps

1. **Read Full Documentation**: `CODE_IMPROVEMENTS_SUMMARY.md`
2. **Hindi Guide**: `IMPROVEMENTS_HINDI.md`
3. **Run Tests**: `./TEST_ALL_IMPROVEMENTS.sh`
4. **Check Logs**: Monitor backend console for issues
5. **Customize**: Edit settings, themes, prompts as needed

---

## ❓ Common Questions

**Q: Where are messages stored?**
A: `data/memory/user1/conversations.json` and in desktop app's localStorage

**Q: Can I use without internet?**
A: Yes! Everything works offline if Ollama is running locally

**Q: How to clear cache?**
A: Restart backend or call `brain.clearCache()` in code

**Q: How to backup data?**
A: Copy `data/memory/` folder or use export API

**Q: How to change AI model?**
A: Set `OLLAMA_MODEL` in `.env` and restart backend

---

## 🆘 Get Help

- Check logs in terminal
- Run diagnostic: `./TEST_ALL_IMPROVEMENTS.sh`
- Read error messages carefully
- Check system requirements (Node 18+, Ollama)

---

**Everything should work smoothly now! Enjoy RAGS AI! 🎉**
