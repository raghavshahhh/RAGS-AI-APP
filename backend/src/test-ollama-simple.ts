#!/usr/bin/env tsx
// Simple Ollama Test - No API Keys Needed
import dotenv from 'dotenv';
import { OllamaBrain } from './services/ollama-brain';

dotenv.config();

async function testOllama() {
  console.log('🧪 Testing RAGS Ollama Brain...\n');

  try {
    const brain = new OllamaBrain({
      model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
    });

    // Check if Ollama is available
    console.log('🔍 Checking Ollama connection...');
    const available = await brain.isAvailable();
    
    if (!available) {
      console.error('❌ Ollama is not running!');
      console.error('\n🔧 Start Ollama with: ollama serve');
      process.exit(1);
    }

    console.log('✅ Ollama is running!\n');

    // List available models
    console.log('📋 Available models:');
    const models = await brain.listModels();
    models.forEach(model => console.log(`   - ${model}`));
    console.log('');

    // Test chat
    console.log('💬 Testing chat...');
    console.log('User: "Hello RAGS, introduce yourself"');
    
    const response = await brain.chat('Hello RAGS, introduce yourself in Hinglish. Keep it short.');
    
    console.log(`\n🤖 RAGS: "${response}"\n`);
    console.log('✅ Chat test successful!\n');

    // Test another message
    console.log('💬 Testing follow-up...');
    console.log('User: "What can you do?"');
    
    const response2 = await brain.chat('What can you do? List 3 things briefly.');
    
    console.log(`\n🤖 RAGS: "${response2}"\n`);
    console.log('✅ All tests passed! 🎉\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure Ollama is running: ollama serve');
    console.error('2. Check if model exists: ollama list');
    console.error('3. Pull model if needed: ollama pull llama3.2:3b');
    process.exit(1);
  }
}

testOllama();
