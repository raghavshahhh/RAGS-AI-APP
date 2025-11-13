# 🚀 RAGS AI - Quick Run Guide

## ⚡ Fastest Way to Start

### Option 1: One Command (Recommended)
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1
./START_RAGS.sh
```

### Option 2: Manual Start
```bash
cd /Users/raghavpratap/Desktop/RAGS.V1/desktop
npm run dev
```

---

## 🎯 What Happens

1. ✅ Script checks Node.js and npm
2. ✅ Installs dependencies (if needed)
3. ✅ Starts RAGS Desktop App
4. ✅ Opens in browser at `http://localhost:5173`

---

## 🎤 How to Use

### First Time Setup:
1. **Welcome Screen** appears
2. Choose AI Model (Ollama/OpenAI/Gemini)
3. Enter your name
4. Click "Start RAGS AI"

### Using RAGS:
1. **Click Mic Button** (in voice input box)
2. **Speak** - Say "Hello" or "Namaste"
3. **Wait** - RAGS will respond
4. **Continue** - Keep talking!

---

## 🎨 Features Available

### ✅ Working Now:
- 🎤 **Voice Recognition** - Speak to RAGS
- 🔊 **Voice Response** - RAGS speaks back
- 💬 **Chat Panel** - Text conversations
- ⚙️ **Settings** - Configure RAGS
- 📅 **Schedule** - View tasks
- 🤖 **Automation** - Create routines

### 🎯 RAGS Can Do:
- Tell time and date
- Math calculations
- Coding help (Python, JavaScript)
- General questions
- System commands (coming soon)

---

## 🛑 How to Stop

Press `Ctrl+C` in terminal

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Dependencies Issue
```bash
cd desktop
rm -rf node_modules package-lock.json
npm install
```

### Voice Not Working
1. Check browser permissions (allow microphone)
2. Click mic button manually
3. Speak clearly and wait 2 seconds

---

## 📝 Notes

- **No Backend Needed** - Frontend works standalone
- **Offline Mode** - Works without internet
- **Browser Required** - Opens in default browser
- **Mic Required** - For voice features

---

## 🎉 Ready to Go!

Just run:
```bash
./START_RAGS.sh
```

And start talking to RAGS! 🚀
