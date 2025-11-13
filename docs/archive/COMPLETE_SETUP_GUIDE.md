# 🚀 RAGS AI - Complete Setup Guide

## Raghav Bhai, Mac App aur iOS Simulator Setup! 🔥

**Goal:** Proper Mac app window aur iOS simulator mein native app (not Expo Go)

---

## 📋 STEP 1: Install Ollama (AI Brain)

### Install:
```bash
# Download and install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# OR download from website:
# https://ollama.com/download
```

### Download Model:
```bash
# Download Llama 3.2 (3B model - fast and good)
ollama pull llama3.2

# OR download larger model (better quality):
ollama pull llama3.2:7b
```

### Test:
```bash
# Start Ollama service
ollama serve

# In another terminal, test:
ollama run llama3.2 "Hello, who are you?"
```

**Expected:** AI responds with text

---

## 📋 STEP 2: Install Whisper.cpp (Voice Recognition)

### Install:
```bash
# Clone repository
cd /tmp
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp

# Build
make

# Download model (base model - good balance)
bash ./models/download-ggml-model.sh base

# OR download tiny model (faster):
bash ./models/download-ggml-model.sh tiny
```

### Test:
```bash
# Record audio and test
./main -m models/ggml-base.bin -f samples/jfk.wav
```

**Expected:** Transcribed text appears

---

## 📋 STEP 3: Setup Backend

### Install Dependencies:
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1/backend

# Install all packages
npm install

# Make sure Ollama is running
ollama serve &
```

### Configure .env:
```bash
# Edit .env file
nano .env

# Add these:
PORT=3000
OLLAMA_URL=http://localhost:11434
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### Run Backend:
```bash
npm run dev
```

**Expected:**
```
🚀 RAGS Backend Server
📡 Server running on http://localhost:3000
✅ Ollama connected
```

---

## 📋 STEP 4: Setup Desktop Mac App (Tauri)

### Install Rust (Required for Tauri):
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Restart terminal or run:
source $HOME/.cargo/env

# Verify
rustc --version
cargo --version
```

### Install Tauri CLI:
```bash
# Install Tauri CLI globally
cargo install tauri-cli

# OR use npm version:
npm install -g @tauri-apps/cli
```

### Build & Run Desktop App:
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1/desktop

# Install dependencies
npm install

# Run in development mode (opens Mac window)
npm run tauri dev

# OR build production app:
npm run tauri build
```

**Expected:**
- ✅ Mac application window opens
- ✅ JARVIS-style UI visible
- ✅ 3D orb animates
- ✅ Proper Mac app (not browser)

**Production Build Location:**
```
desktop/src-tauri/target/release/bundle/macos/RAGS AI.app
```

---

## 📋 STEP 5: Setup iOS App (Standalone - Not Expo Go)

### Install EAS CLI:
```bash
# Install Expo Application Services CLI
npm install -g eas-cli

# Login to Expo
eas login
```

### Configure for Standalone Build:
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1/mobile

# Initialize EAS
eas build:configure

# This creates eas.json
```

### Build iOS Simulator App:
```bash
# Build for iOS Simulator (development build)
eas build --profile development --platform ios --local

# This creates a .app file you can install in simulator
```

### Install in Simulator:
```bash
# Open simulator
open -a Simulator

# Drag and drop the .app file to simulator
# OR use command:
xcrun simctl install booted path/to/RAGS.app
```

**Expected:**
- ✅ Proper iOS app icon (RAGS logo)
- ✅ Splash screen shows
- ✅ Native app (not Expo Go)
- ✅ Works like real iPhone app

---

## 📋 STEP 6: Alternative - Use React Native CLI (Pure Native)

### Convert to React Native CLI:
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1

# Create new React Native project
npx react-native init RAGSMobile --template react-native-template-typescript

# Copy your code
cp -r mobile/src RAGSMobile/
cp mobile/assets/* RAGSMobile/ios/RAGSMobile/Images.xcassets/
```

### Run on iOS:
```bash
cd RAGSMobile

# Install pods
cd ios && pod install && cd ..

# Run on simulator
npx react-native run-ios

# OR specify simulator:
npx react-native run-ios --simulator="iPhone 15 Pro"
```

**Expected:**
- ✅ Native iOS app
- ✅ Custom icon
- ✅ No Expo dependency
- ✅ Full native features

---

## 🎯 QUICK START (All 3 Apps)

### Terminal 1 - Backend:
```bash
# Start Ollama first
ollama serve &

# Start backend
cd /Users/raghavpratap/Desktop/RAGS.V1/backend
npm run dev
```

### Terminal 2 - Desktop Mac App:
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1/desktop
npm run tauri dev
```

### Terminal 3 - iOS Simulator:
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1/mobile

# Option A: Expo (quick test)
npm start
# Press 'i' for simulator

# Option B: EAS Build (standalone)
eas build --profile development --platform ios --local
```

---

## 📱 WHAT YOU'LL SEE

### Mac Desktop App:
```
✅ Proper Mac window (not browser)
✅ Title bar: "RAGS AI"
✅ Resizable window
✅ Mac-style UI
✅ 3D animated orb
✅ Chat panel
✅ Command palette (Cmd+K)
✅ Memory timeline
✅ Personality selector
```

### iOS Simulator:
```
✅ App icon on home screen (RAGS logo)
✅ Splash screen on launch
✅ Native navigation
✅ Smooth animations
✅ Bottom tab bar
✅ Voice button
✅ Looks like real iPhone app
```

---

## 🔧 TROUBLESHOOTING

### Ollama Issues:
```bash
# Check if running
ps aux | grep ollama

# Restart
killall ollama
ollama serve

# Test connection
curl http://localhost:11434/api/tags
```

### Tauri Build Issues:
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install dependencies
brew install webkit2gtk

# Clean and rebuild
cd desktop
rm -rf node_modules dist src-tauri/target
npm install
npm run tauri build
```

### iOS Build Issues:
```bash
# Clear Expo cache
cd mobile
npx expo start --clear

# Reset simulator
xcrun simctl erase all

# Rebuild
eas build --profile development --platform ios --local --clear-cache
```

---

## ✅ VERIFICATION CHECKLIST

### Backend:
- [ ] Ollama installed and running
- [ ] Backend server on port 3000
- [ ] API endpoints responding
- [ ] Ollama connection working

### Desktop:
- [ ] Rust installed
- [ ] Tauri CLI installed
- [ ] Mac app window opens
- [ ] UI renders correctly
- [ ] All features work

### Mobile:
- [ ] EAS CLI installed
- [ ] iOS simulator running
- [ ] App icon visible
- [ ] Standalone app (not Expo Go)
- [ ] All features work

---

## 🚀 PRODUCTION BUILDS

### Mac App (.app):
```bash
cd desktop
npm run tauri build

# Output:
# desktop/src-tauri/target/release/bundle/macos/RAGS AI.app

# Double-click to run!
```

### iOS App (.ipa):
```bash
cd mobile

# Build for App Store
eas build --profile production --platform ios

# Build for TestFlight
eas build --profile preview --platform ios
```

---

## 📚 NEXT STEPS

1. ✅ Install Ollama
2. ✅ Install Whisper.cpp
3. ✅ Run backend
4. ✅ Build Mac app
5. ✅ Build iOS app
6. ✅ Test all features
7. ✅ Polish UI/UX
8. ✅ Add more features
9. ✅ Deploy!

---

**Raghav bhai, ab proper Mac app aur iOS app dikhega!** 🔥

**No Expo Go, proper native apps!** ✨


