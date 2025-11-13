# 🚀 RAGS AI - Complete Setup & Run Guide

## ✨ What's New - Fully Enhanced!

### 🎯 **ALL FEATURES NOW WORKING:**
- ✅ **Mobile App** - Full voice recording + camera capture
- ✅ **Desktop App** - Enhanced voice service + camera support
- ✅ **Backend** - WebSocket support + simple voice API
- ✅ **Real-time Communication** - WebSocket for instant updates
- ✅ **Better Error Handling** - Proper feedback and error messages
- ✅ **Smooth Animations** - Polished UI/UX across all platforms

---

## 📋 Prerequisites

### Required:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn**

### Optional (for advanced features):
- **Rust** (for desktop app builds) - [Install](https://rustup.rs/)
- **Expo Go** app (for mobile testing on device)
- **Ollama** (for local AI) - [Install](https://ollama.ai/)

---

## ⚡ Quick Start (5 Minutes)

### 1️⃣ Install All Dependencies

```bash
# Backend
cd backend
npm install

# Desktop
cd ../desktop
npm install

# Mobile
cd ../mobile
npm install
```

---

### 2️⃣ Start Backend Server

```bash
cd backend
npm run dev
```

✅ **Backend running on:** `http://localhost:3000`
✅ **WebSocket running on:** `ws://localhost:3000`

---

### 3️⃣ Start Desktop App

```bash
cd desktop
npm run dev
```

✅ **Desktop app opens with:**
- 🌀 Beautiful 3D AI Orb
- 🎤 Enhanced voice recognition
- 📷 Camera capture support
- 💬 Real-time chat
- ⚡ Quick actions

**How to use:**
1. Click the **Mic button** to start voice input
2. Speak clearly
3. RAGS will respond with voice
4. Use camera icon for visual features

---

### 4️⃣ Start Mobile App

```bash
cd mobile
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with **Expo Go** app on your phone

✅ **Mobile app features:**
- 🎤 **Voice Recording** - Tap mic button to record
- 📷 **Camera Capture** - Take photos for AI analysis
- 💬 **Real-time Chat** - Instant responses
- 🎨 **Beautiful UI** - Smooth animations
- 📱 **Native Feel** - Haptic feedback

**How to use:**
1. Tap **🎤 Speak** button
2. Grant microphone permission
3. Speak your command
4. Wait for AI response
5. Tap camera icon for photos

---

## 🎨 Features Breakdown

### **Mobile App (React Native + Expo)**

#### Voice Features:
- ✅ Real microphone recording using `expo-av`
- ✅ Audio sent to backend for processing
- ✅ Visual feedback (Recording/Processing states)
- ✅ Haptic feedback on interactions
- ✅ Permission handling

#### Camera Features:
- ✅ Camera access using `expo-camera`
- ✅ Front/back camera toggle
- ✅ Photo capture with preview
- ✅ Retake/Use photo options
- ✅ Permission handling

#### UI/UX:
- ✅ Animated AI orb with pulse effect
- ✅ Gradient backgrounds
- ✅ Glassmorphic cards
- ✅ Bottom navigation
- ✅ Status indicators
- ✅ Response display

---

### **Desktop App (Tauri + React)**

#### Voice Features:
- ✅ Enhanced Web Speech API integration
- ✅ Better error handling and auto-restart
- ✅ Adaptive silence detection
- ✅ Duplicate prevention
- ✅ Male voice synthesis
- ✅ Real-time transcription

#### Camera Features:
- ✅ Browser camera access
- ✅ Photo capture
- ✅ Front/back camera toggle
- ✅ Image preview and retake
- ✅ Base64 image export

#### UI/UX:
- ✅ 3D rotating AI orb (Three.js)
- ✅ Voice visualizer with bars
- ✅ Command palette (⌘+K)
- ✅ Chat panel with history
- ✅ Quick actions
- ✅ Settings panel
- ✅ Glassmorphic design

---

### **Backend (Node.js + Express)**

#### APIs:
- ✅ `/api/v1/voice/chat` - Text chat with AI
- ✅ `/api/v1/voice/process` - Process audio files
- ✅ `/api/v1/voice/start` - Start voice pipeline
- ✅ `/api/v1/voice/stop` - Stop voice pipeline
- ✅ `/api/v1/voice/status` - Get status
- ✅ `/health` - Health check

#### WebSocket:
- ✅ Real-time bidirectional communication
- ✅ Connection status updates
- ✅ Message broadcasting
- ✅ Error handling

#### Services:
- ✅ Ollama Brain (Local AI)
- ✅ Memory System (Supabase)
- ✅ Vision System (Camera/Screen)
- ✅ TTS/STT (Hybrid)
- ✅ Wake Word (Porcupine)

---

## 🔧 Configuration

### Backend `.env` file:

```bash
PORT=3000
NODE_ENV=development

# Optional - for advanced features
OLLAMA_URL=http://localhost:11434
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
PICOVOICE_ACCESS_KEY=your_picovoice_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

### Mobile API Configuration:

Edit `mobile/src/services/api.ts`:
```typescript
const API_URL = 'http://YOUR_IP:3000/api/v1';
// Replace YOUR_IP with your computer's IP address
// Find it with: ipconfig (Windows) or ifconfig (Mac/Linux)
```

---

## 📱 Testing on Real Device

### For Mobile App:

1. **Find your computer's IP address:**
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. **Update API URL in `mobile/src/services/api.ts`:**
   ```typescript
   const API_URL = 'http://192.168.1.100:3000/api/v1';
   // Replace with your actual IP
   ```

3. **Make sure backend is running**

4. **Scan QR code with Expo Go app**

5. **Grant permissions:**
   - Microphone
   - Camera

---

## 🎯 Usage Examples

### Voice Commands (Desktop & Mobile):

```
"Hey RAGS, what can you do?"
"Create a reminder for 6 PM"
"What's the weather today?"
"Take a note about AI research"
"Show me my schedule"
```

### Camera Features:

1. Click camera icon
2. Grant permission
3. Take photo
4. Use for AI analysis

---

## 🐛 Troubleshooting

### Mobile App:

**Microphone not working:**
- Check app permissions in Settings
- Restart the app
- Make sure backend is running

**Camera not working:**
- Grant camera permission
- Check if camera is being used by another app
- Restart the app

**Can't connect to backend:**
- Check if backend is running
- Verify IP address in api.ts
- Make sure you're on the same network

### Desktop App:

**Voice not working:**
- Check browser permissions
- Try Chrome/Edge (best support)
- Restart the app

**Camera not working:**
- Grant browser camera permission
- Check if camera is available
- Try different browser

---

## 🚀 Production Build

### Desktop App:
```bash
cd desktop
npm run tauri:build
```
Output: `desktop/src-tauri/target/release/bundle/`

### Mobile App:
```bash
cd mobile
eas build --platform ios
eas build --platform android
```

---

## 📊 Architecture

```
RAGS.V1/
├── backend/          # Node.js + Express + WebSocket
│   ├── Voice API
│   ├── WebSocket Server
│   └── AI Services
│
├── desktop/          # Tauri + React + Three.js
│   ├── Enhanced Voice Service
│   ├── Camera Capture
│   └── 3D AI Orb
│
└── mobile/           # React Native + Expo
    ├── Voice Recording (expo-av)
    ├── Camera (expo-camera)
    └── Haptic Feedback
```

---

## ✨ What Makes This Special

1. **🎤 Real Voice** - Not just UI, actual microphone recording
2. **📷 Real Camera** - Actual camera access and capture
3. **🔄 Real-time** - WebSocket for instant updates
4. **💪 Robust** - Proper error handling everywhere
5. **🎨 Beautiful** - Polished UI with smooth animations
6. **📱 Cross-platform** - Works on Desktop, iOS, Android
7. **🚀 Production Ready** - Can be built and deployed

---

## 🎉 You're All Set!

Your RAGS AI is now fully functional with:
- ✅ Working voice input on all platforms
- ✅ Working camera on all platforms
- ✅ Real-time communication
- ✅ Beautiful, polished UI
- ✅ Proper error handling
- ✅ Production-ready code

**Enjoy your AI assistant! 🤖**

---

Made with ❤️ by Raghav

