import { OllamaBrain } from './services/ollama-brain';
import dotenv from 'dotenv';

dotenv.config();

async function testOllama() {
  console.log('🧪 Testing Ollama Brain Directly...\n');

  try {
    const brain = new OllamaBrain({
      model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
      temperature: 0.7,
      systemPrompt: '' // No system prompt for testing
    });

    console.log('📝 Sending test message...');
    const response = await brain.chat('What is 2+2? Answer briefly.');
    
    console.log('\n✅ Success!');
    console.log('Response:', response);
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testOllama();
