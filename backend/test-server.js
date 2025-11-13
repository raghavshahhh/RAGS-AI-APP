const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/v1/voice/process', (req, res) => {
  const { text } = req.body;
  console.log('Received:', text);
  
  const input = (text || '').toLowerCase();
  let response = '';
  
  if (input.includes('hello') || input.includes('hi')) {
    response = 'नमस्ते! मैं रैग्स हूँ। कैसे मदद कर सकता हूँ?';
  } else if (input.includes('time')) {
    const time = new Date().toLocaleTimeString('hi-IN');
    response = `अभी ${time} बज रहे हैं`;
  } else {
    response = 'मैं समझ गया। कुछ और पूछें।';
  }
  
  res.json({
    success: true,
    transcription: text,
    response: response,
    timestamp: new Date().toISOString()
  });
});

app.listen(3000, () => {
  console.log('✅ Test server running on port 3000');
});

