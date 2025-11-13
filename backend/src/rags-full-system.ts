#!/usr/bin/env tsx
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { OllamaBrain } from './services/ollama-brain';
import { MacAutomation } from './services/mac-automation';
import { privacyAI } from './services/privacy-ai-brain';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize services
const brain = new OllamaBrain({ model: process.env.OLLAMA_MODEL || 'llama3.2:3b' });
const macAuto = new MacAutomation();

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║    🤖 RAGS AI - Full Integrated System                                      ║
║                                                                              ║
║    ✅ Ollama AI Brain                                                        ║
║    ✅ Mac Automation                                                         ║
║    ✅ Privacy AI                                                             ║
║    ✅ REST API                                                               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'RAGS AI - Full System',
    status: 'running',
    version: '2.0.0',
    features: ['AI Chat', 'Mac Automation', 'Privacy Mode', 'System Control'],
    timestamp: new Date().toISOString()
  });
});

// Chat with AI (with real system context)
app.post('/api/v1/chat', async (req, res) => {
  try {
    const { message, usePrivacy } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Get real system data
    const battery = await macAuto.getBatteryStatus();
    const wifi = await macAuto.getWiFiStatus();
    const systemInfo = await macAuto.getSystemInfo();
    const runningApps = await macAuto.getRunningApps();
    const currentTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    // Build context with real data
    const context = `Current System Status:
- Time: ${currentTime}
- Computer: ${systemInfo.computerName}
- User: ${systemInfo.username}
- Battery: ${battery.percentage}% ${battery.charging ? '(Charging)' : '(Not Charging)'}
- WiFi: ${wifi.connected ? `Connected to ${wifi.ssid}` : 'Disconnected'}
- Running Apps: ${runningApps.slice(0, 5).join(', ')}
- macOS: ${systemInfo.macOSVersion}

User Question: ${message}`;

    const response = usePrivacy 
      ? await privacyAI.chat(context)
      : await brain.chat(context);

    res.json({
      success: true,
      response,
      mode: usePrivacy ? 'privacy' : 'standard',
      systemData: { battery, wifi, runningApps: runningApps.slice(0, 5) },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// System status
app.get('/api/v1/system/status', async (req, res) => {
  try {
    const battery = await macAuto.getBatteryStatus();
    const wifi = await macAuto.getWiFiStatus();
    const systemInfo = await macAuto.getSystemInfo();
    const runningApps = await macAuto.getRunningApps();

    res.json({
      success: true,
      system: {
        battery,
        wifi,
        info: systemInfo,
        runningApps: runningApps.slice(0, 10)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mac automation - Open app
app.post('/api/v1/mac/open-app', async (req, res) => {
  try {
    const { appName } = req.body;
    await macAuto.openApp(appName);
    res.json({ success: true, message: `${appName} opened` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mac automation - Screenshot
app.post('/api/v1/mac/screenshot', async (req, res) => {
  try {
    const path = await macAuto.takeScreenshot();
    res.json({ success: true, path });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mac automation - Volume
app.post('/api/v1/mac/volume', async (req, res) => {
  try {
    const { level } = req.body;
    await macAuto.setVolume(level);
    res.json({ success: true, message: `Volume set to ${level}%` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mac automation - Notification
app.post('/api/v1/mac/notify', async (req, res) => {
  try {
    const { title, message } = req.body;
    await macAuto.sendNotification(title, message);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mac automation - Speak
app.post('/api/v1/mac/speak', async (req, res) => {
  try {
    const { text } = req.body;
    await macAuto.speak(text);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search files
app.post('/api/v1/mac/search-files', async (req, res) => {
  try {
    const { query } = req.body;
    const results = await macAuto.searchFiles(query);
    res.json({ success: true, results, count: results.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI models list
app.get('/api/v1/ai/models', async (req, res) => {
  try {
    const models = await brain.listModels();
    res.json({ success: true, models });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`\n🚀 RAGS AI Full System running on http://localhost:${PORT}\n`);
  
  // Check Ollama
  const ollamaOk = await brain.isAvailable();
  console.log(`🧠 Ollama: ${ollamaOk ? '✅ Connected' : '❌ Not available'}`);
  
  if (ollamaOk) {
    const models = await brain.listModels();
    console.log(`📦 Models: ${models.join(', ')}`);
  }
  
  console.log(`\n📝 API Endpoints:`);
  console.log(`   POST /api/v1/chat - AI Chat`);
  console.log(`   GET  /api/v1/system/status - System Status`);
  console.log(`   POST /api/v1/mac/open-app - Open App`);
  console.log(`   POST /api/v1/mac/screenshot - Take Screenshot`);
  console.log(`   POST /api/v1/mac/volume - Set Volume`);
  console.log(`   POST /api/v1/mac/notify - Send Notification`);
  console.log(`   POST /api/v1/mac/speak - Text to Speech`);
  console.log(`   POST /api/v1/mac/search-files - Search Files`);
  console.log(`   GET  /api/v1/ai/models - List AI Models`);
  
  console.log(`\n✅ RAGS AI Ready!\n`);
});
