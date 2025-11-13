# 🚀 RAGS AI - How to Run All Apps

## Raghav Bhai, Sab Kuch Run Karne Ka Tarika! 🔥

---

## 📱 STEP-BY-STEP GUIDE

### Prerequisites:

```bash
# Make sure you're in the project directory
cd /Users/raghavpratap/Desktop/RAGS.V1

# Check Node.js version
node --version  # Should be v18+ or v20+

# Check npm
npm --version
```

---

## 🎯 METHOD 1: Run Everything Separately (Recommended)

### Terminal 1: Backend Server

```bash
# Open Terminal 1
cd /Users/raghavpratap/Desktop/RAGS.V1/backend

# Run backend
npm run dev

# Expected output:
# 🚀 RAGS Backend Server
# 📡 Server running on http://localhost:3000
```

**Keep this terminal open!**

---

### Terminal 2: Desktop App

```bash
# Open NEW Terminal 2
cd /Users/raghavpratap/Desktop/RAGS.V1/desktop

# Run desktop app
npm run dev

# Expected output:
# VITE v5.x.x ready in XXX ms
# ➜ Local: http://localhost:1420/
# ➜ Tauri window will open
```

**Desktop window will open automatically!**

---

### Terminal 3: Mobile App

```bash
# Open NEW Terminal 3
cd /Users/raghavpratap/Desktop/RAGS.V1/mobile

# Run mobile app
npm start

# Expected output:
# › Metro waiting on exp://192.168.x.x:8081
# › Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
#
# › Press i │ open iOS simulator
# › Press a │ open Android emulator
```

**Then press:**
- `i` for iOS Simulator
- `a` for Android Emulator
- Scan QR for physical device

---

## 🎯 METHOD 2: Use Script (All at Once)

```bash
# Make script executable
chmod +x scripts/start-all.sh

# Run all apps
./scripts/start-all.sh
```

This will open 3 terminals automatically!

---

## 🎯 METHOD 3: Manual Commands (Quick Test)

### Backend Only:
```bash
cd backend && npx tsx src/index.ts
```

### Desktop Only:
```bash
cd desktop && npm run dev
```

### Mobile Only:
```bash
cd mobile && npx expo start
```

---

## 📱 TESTING ON DEVICES

### iOS Simulator:

```bash
# 1. Start mobile app
cd mobile && npm start

# 2. Press 'i' when Expo starts
# 3. iOS Simulator will open automatically
# 4. App will install and launch
```

**Expected:**
- ✅ Custom RAGS icon visible
- ✅ Splash screen shows
- ✅ App loads with bottom navigation

---

### Android Emulator:

```bash
# 1. Make sure Android Studio is installed
# 2. Start an emulator from Android Studio
# OR
# 3. Use command line:
emulator -avd Pixel_5_API_33

# 4. Start mobile app
cd mobile && npm start

# 5. Press 'a' when Expo starts
```

**Expected:**
- ✅ Adaptive icon visible
- ✅ Splash screen shows
- ✅ App loads successfully

---

### Physical Device:

```bash
# 1. Install Expo Go app on your phone
# iOS: App Store
# Android: Play Store

# 2. Start mobile app
cd mobile && npm start

# 3. Scan QR code with:
# iOS: Camera app
# Android: Expo Go app

# 4. App will load on your device
```

---

## 💻 TESTING DESKTOP APP

### Mac:

```bash
cd desktop && npm run dev
```

**Expected:**
- ✅ Window opens (800x600)
- ✅ Dark theme with gradient background
- ✅ 3D orb in center (animated)
- ✅ Chat panel on right
- ✅ Status bar at bottom
- ✅ Press Cmd+K for command palette

**Test Features:**
1. Click orb → Should pulse
2. Type in chat → Should work
3. Press Cmd+K → Command palette opens
4. Check memory timeline tab
5. Check personality selector

---

### Windows (Future):

```bash
cd desktop && npm run dev
```

Same as Mac, but:
- Press Ctrl+K instead of Cmd+K

---

## 🧪 TESTING FEATURES

### 1. Voice Pipeline (Backend):

```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Test voice endpoint
curl -X POST http://localhost:3000/api/voice \
  -H "Content-Type: application/json" \
  -d '{"text":"hello RAGS"}'
```

**Expected:**
```json
{
  "response": "Hello! How can I help you?",
  "status": "success"
}
```

---

### 2. Desktop UI:

**Test Checklist:**
- [ ] Orb animates smoothly
- [ ] Chat input works
- [ ] Command palette (Cmd+K) opens
- [ ] Memory timeline shows
- [ ] Personality selector works
- [ ] Quick actions clickable
- [ ] Status bar updates

---

### 3. Mobile UI:

**Test Checklist:**
- [ ] Custom icon visible
- [ ] Splash screen shows
- [ ] Bottom navigation works
- [ ] Orb tap responds
- [ ] Voice button works
- [ ] Quick actions work
- [ ] Smooth animations

---

### 4. API Integration:

```bash
# Test backend health
curl http://localhost:3000/health

# Test notes endpoint
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Hello"}'

# Test reminders
curl http://localhost:3000/api/reminders

# Test routines
curl http://localhost:3000/api/routines
```

---

## 🐛 TROUBLESHOOTING

### Backend Won't Start:

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Try again
cd backend && npm run dev
```

---

### Desktop Won't Start:

```bash
# Clear cache
cd desktop
rm -rf node_modules dist
npm install
npm run dev
```

---

### Mobile Won't Start:

```bash
# Clear Expo cache
cd mobile
npx expo start --clear

# Or reset completely
rm -rf node_modules
npm install
npm start
```

---

### iOS Simulator Issues:

```bash
# Reset simulator
xcrun simctl erase all

# Restart Expo
cd mobile && npx expo start --ios
```

---

### Android Emulator Issues:

```bash
# List available emulators
emulator -list-avds

# Start specific emulator
emulator -avd <name>

# Cold boot (if frozen)
emulator -avd <name> -no-snapshot-load
```

---

## 📊 EXPECTED PORTS

```
Backend:  http://localhost:3000
Desktop:  http://localhost:1420
Mobile:   exp://localhost:8081 (Expo)
```

**Make sure these ports are free!**

---

## ✅ SUCCESS INDICATORS

### Backend Running:
```
✅ 🚀 RAGS Backend Server
✅ 📡 Server running on http://localhost:3000
✅ ✨ Voice pipeline initialized
```

### Desktop Running:
```
✅ VITE v5.x.x ready
✅ ➜ Local: http://localhost:1420/
✅ Window opens with JARVIS UI
```

### Mobile Running:
```
✅ › Metro waiting on exp://...
✅ › Press i │ open iOS simulator
✅ QR code visible
```

---

## 🎯 QUICK START COMMANDS

**Copy-paste these in 3 separate terminals:**

```bash
# Terminal 1 (Backend)
cd /Users/raghavpratap/Desktop/RAGS.V1/backend && npm run dev

# Terminal 2 (Desktop)
cd /Users/raghavpratap/Desktop/RAGS.V1/desktop && npm run dev

# Terminal 3 (Mobile)
cd /Users/raghavpratap/Desktop/RAGS.V1/mobile && npm start
```

---

## 🎊 SUMMARY

**To run everything:**
1. Open 3 terminals
2. Run backend in terminal 1
3. Run desktop in terminal 2
4. Run mobile in terminal 3
5. Test all features!

**Icons:**
- ✅ Mobile icons created and ready
- ⚠️ Desktop using default icon (works fine)

**Status:**
- ✅ All code ready
- ✅ All dependencies installed
- ✅ TypeScript compiles
- ✅ Ready to test!

---

**Raghav bhai, ab sab kuch run karo aur test karo!** 🚀🔥


