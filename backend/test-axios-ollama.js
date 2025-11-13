const axios = require('axios');

async function test() {
  console.log('Testing Ollama with axios...');
  const start = Date.now();
  
  try {
    const response = await axios.post(
      'http://localhost:11434/api/chat',
      {
        model: 'llama3.2:3b',
        messages: [{ role: 'user', content: 'Hi' }],
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 50
        }
      },
      {
        timeout: 180000,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`✅ Success in ${elapsed}s`);
    console.log('Response:', response.data.message.content);
  } catch (error) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`❌ Failed after ${elapsed}s:`, error.message);
    if (error.code) console.log('Error code:', error.code);
  }
}

test();
