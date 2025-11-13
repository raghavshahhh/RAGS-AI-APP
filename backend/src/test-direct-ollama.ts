#!/usr/bin/env tsx
import axios from 'axios';

async function testDirect() {
  console.log('🧪 Direct Ollama API Test\n');

  try {
    console.log('Testing /api/generate endpoint...');
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3.2:3b',
      prompt: 'Say hi in one word',
      stream: false
    }, { timeout: 30000 });

    console.log('✅ Response:', response.data.response);
    console.log('✅ Ollama working!\n');
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
  }
}

testDirect();
