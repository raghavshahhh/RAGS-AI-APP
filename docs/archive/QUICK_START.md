# 🚀 RAGS AI - Quick Start Guide

Get your JARVIS-style AI assistant running in 5 minutes!

---

## 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn**
- **Rust** (for desktop app) ([Install](https://rustup.rs/))
- **Expo Go** app (for mobile testing)

---

## ⚡ Quick Start

### 1️⃣ Install Dependencies

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

### 2️⃣ Start Backend

```bash
cd backend
npm run dev
```

✅ Backend running on **http://localhost:3000**

---

### 3️⃣ Start Desktop App

```bash
cd desktop
npm run dev
```

✅ Desktop app opens with **3D AI Orb**!

---

### 4️⃣ Start Mobile App

```bash
cd mobile
npm start
```

✅ Scan QR code with **Expo Go** app!

---

## 🎨 Features

### Desktop App
- 🌀 **3D AI Orb** (JARVIS-style)
- 🎤 **Voice Visualizer**
- ⌨️ **Command Palette** (⌘+K)
- 💬 **Chat Panel**
- ⚡ **Quick Actions**
- 🎨 **Glassmorphism UI**

### Mobile App
- 🌀 **Animated AI Orb**
- 🎤 **Voice Button**
- 📱 **Bottom Navigation**
- 💬 **Quick Actions**
- 🎨 **Modern Gradients**

---

## 🔧 Configuration

### Backend (.env)

Already configured with mock values. To use real services:

```bash
# Edit backend/.env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_key
PICOVOICE_ACCESS_KEY=your_key
ELEVENLABS_API_KEY=your_key
GEMINI_API_KEY=your_key
```

---

## 🎯 Keyboard Shortcuts (Desktop)

- **⌘+K** - Open Command Palette
- **⌘+Space** - Start/Stop Voice
- **Esc** - Close Panels

---

## 📱 Mobile Navigation

- **🏠 Home** - Main screen with AI orb
- **💬 Chat** - Chat with AI
- **⚡ Auto** - Automation & routines
- **⚙️ Settings** - App settings

---

## 🐛 Troubleshooting

### Backend won't start?
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Desktop app won't build?
```bash
# Install Rust first
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

cd desktop
npm install
npm run dev
```

### Mobile app not loading?
```bash
cd mobile
rm -rf node_modules package-lock.json
npm install
npm start -- --clear
```

---

## 🎉 You're Ready!

Your JARVIS-style AI assistant is now running!

**Next Steps:**
1. Try voice commands (desktop)
2. Chat with AI
3. Create routines
4. Customize UI

---

## 📚 More Info

- **Full Documentation:** See `SETUP_GUIDE.md`
- **Status Report:** See `FINAL_STATUS_REPORT.md`
- **API Docs:** See `backend/README.md`

---

**Enjoy your AI assistant!** 🚀✨

