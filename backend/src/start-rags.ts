#!/usr/bin/env tsx
// ============================================================================
// RAGS AI - Complete System Startup
// ============================================================================

import dotenv from 'dotenv';
import { RAGSMaster } from './services/rags-master';
import * as fs from 'fs/promises';
import * as path from 'path';

// Load environment variables
dotenv.config();

async function startRAGS() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║    🤖 RAGS AI - Your Offline-First AI Operating System                      ║
║                                                                              ║
║    Ready to serve as your personal AI assistant!                            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

  // Check required environment variables
  const required = [
    'PICOVOICE_ACCESS_KEY',
    'WHISPER_MODEL_PATH', 
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\n📝 Please check your .env file');
    console.error('📖 See SETUP_GUIDE.md for help');
    process.exit(1);
  }

  // Ensure temp directory exists
  const tempDir = path.join(process.cwd(), 'temp');
  try {
    await fs.mkdir(tempDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  try {
    // Create RAGS master instance
    const rags = new RAGSMaster({
      userId: process.env.USER_ID || 'default-user',
      picovoiceKey: process.env.PICOVOICE_ACCESS_KEY!,
      elevenLabsKey: process.env.ELEVENLABS_API_KEY,
      whisperModelPath: process.env.WHISPER_MODEL_PATH!,
      ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2:3b',
      enableCamera: process.env.ENABLE_CAMERA !== 'false', // Default true
      enableScreenAccess: process.env.ENABLE_SCREEN_ACCESS !== 'false', // Default true
      enableSystemControl: process.env.ENABLE_SYSTEM_CONTROL !== 'false', // Default true
    });

    // Setup event handlers
    rags.on('ready', () => {
      console.log('🎉 RAGS AI is now fully operational!');
      console.log('🎤 Say "Hey RAGS" to activate voice control');
      console.log('💬 RAGS will welcome you and ask how to help');
      console.log('\n📊 System Status:');
      showSystemStatus(rags);
    });

    rags.on('activated', () => {
      console.log('🔥 RAGS activated by wake word!');
    });

    rags.on('user-message', (message) => {
      console.log(`👤 User: "${message}"`);
    });

    rags.on('rags-response', (response) => {
      console.log(`🤖 RAGS: "${response}"`);
    });

    rags.on('error', (error) => {
      console.error('❌ RAGS Error:', error);
    });

    rags.on('shutdown', () => {
      console.log('👋 RAGS has been shut down');
      process.exit(0);
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down RAGS...');
      await rags.shutdown();
    });

    process.on('SIGTERM', async () => {
      console.log('\n\n🛑 Shutting down RAGS...');
      await rags.shutdown();
    });

    // Initialize RAGS
    await rags.initialize();

    // Show periodic status updates
    setInterval(async () => {
      try {
        const status = await rags.getSystemStatus();
        console.log(`\n📊 Status Update - Battery: ${status.battery.percentage}% | Voice: ${status.voiceReady ? '🎤' : '🔇'} | Memory: ${status.memoryCount} items`);
      } catch (error) {
        // Ignore status errors
      }
    }, 300000); // Every 5 minutes

  } catch (error: any) {
    console.error('\n❌ Failed to start RAGS:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure Ollama is running: ollama serve');
    console.error('2. Check if whisper binary exists');
    console.error('3. Verify Picovoice access key is valid');
    console.error('4. Check Supabase connection');
    console.error('5. Ensure microphone permissions are granted');
    process.exit(1);
  }
}

async function showSystemStatus(rags: RAGSMaster) {
  try {
    const status = await rags.getSystemStatus();
    
    console.log(`   🔋 Battery: ${status.battery.percentage}% ${status.battery.charging ? '⚡' : ''}`);
    console.log(`   📶 WiFi: ${status.wifi.connected ? `✅ ${status.wifi.ssid}` : '❌ Disconnected'}`);
    console.log(`   💻 Computer: ${status.systemInfo.computerName}`);
    console.log(`   👤 User: ${status.systemInfo.username}`);
    console.log(`   🎤 Voice: ${status.voiceReady ? '✅ Ready' : '❌ Not Ready'}`);
    console.log(`   🧠 Memory: ${status.memoryCount} stored items`);
    console.log(`   📱 Running Apps: ${status.runningApps.slice(0, 5).join(', ')}`);
    
  } catch (error) {
    console.log('   ⚠️  Could not fetch system status');
  }
}

// Start RAGS
startRAGS().catch(console.error);