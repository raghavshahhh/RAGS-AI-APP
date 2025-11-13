#!/usr/bin/env tsx
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OllamaBrain } from './services/ollama-brain';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'RAGS AI',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Chat endpoint
app.post('/api/v1/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    const brain = new OllamaBrain({
      model: process.env.OLLAMA_MODEL || 'llama3.2:3b'
    });

    const response = await brain.chat(message);

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 RAGS AI Backend running on http://localhost:${PORT}`);
  console.log(`📝 Test: curl -X POST http://localhost:${PORT}/api/v1/chat -H "Content-Type: application/json" -d '{"message":"Hello"}'`);
  console.log(`\n✅ Ready to serve!\n`);
});
