// ============================================================================
// RAGS AI - Voice Pipeline Test Script
// ============================================================================

import dotenv from 'dotenv';
import { VoicePipeline } from './services/voice-pipeline';

// Load environment variables
dotenv.config();

async function testVoicePipeline() {
  console.log('🧪 Testing RAGS Voice Pipeline...\n');

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
    console.error('\nPlease check your .env file');
    process.exit(1);
  }

  try {
    // Create voice pipeline
    const pipeline = new VoicePipeline({
      userId: 'test-user-123',
      picovoiceKey: process.env.PICOVOICE_ACCESS_KEY!,
      elevenLabsKey: process.env.ELEVENLABS_API_KEY,
      whisperModelPath: process.env.WHISPER_MODEL_PATH!,
      ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2:3b',
    });

    // Setup event listeners
    pipeline.on('ready', () => {
      console.log('✅ Voice pipeline ready!');
      console.log('\n🎤 Say "Hey RAGS" to activate...\n');
    });

    pipeline.on('wakeword', (data) => {
      console.log('🔥 Wake word detected!', data);
    });

    pipeline.on('listening', () => {
      console.log('👂 Listening for your command...');
    });

    pipeline.on('transcription', (data) => {
      console.log(`\n📝 You said: "${data.text}"\n`);
    });

    pipeline.on('processing', () => {
      console.log('🧠 Processing with AI...');
    });

    pipeline.on('response', (data) => {
      console.log(`\n💬 RAGS: "${data.text}"\n`);
    });

    pipeline.on('speaking', () => {
      console.log('🔊 Speaking response...');
    });

    pipeline.on('complete', () => {
      console.log('✅ Interaction complete!\n');
      console.log('🎤 Say "Hey RAGS" again to continue...\n');
    });

    pipeline.on('error', (error) => {
      console.error('❌ Error:', error);
    });

    pipeline.on('stopped', () => {
      console.log('🛑 Voice pipeline stopped');
      process.exit(0);
    });

    // Start the pipeline
    await pipeline.start();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down...');
      await pipeline.stop();
    });

    process.on('SIGTERM', async () => {
      console.log('\n\n🛑 Shutting down...');
      await pipeline.stop();
    });

  } catch (error: any) {
    console.error('\n❌ Failed to start voice pipeline:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure Ollama is running: ollama serve');
    console.error('2. Check if whisper binary exists:', process.env.WHISPER_CPP_PATH);
    console.error('3. Verify Picovoice access key is valid');
    console.error('4. Check Supabase connection');
    process.exit(1);
  }
}

// Run test
testVoicePipeline();

