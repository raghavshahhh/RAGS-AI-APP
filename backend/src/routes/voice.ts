// ============================================================================
// RAGS AI - Voice API Routes
// ============================================================================

import { Router, Request, Response } from 'express';
import { VoicePipeline } from '../services/voice-pipeline';
import { OllamaBrain } from '../services/ollama-brain';
import { MemorySystem } from '../services/memory-system';

const router = Router();

// Global voice pipeline instance
let voicePipeline: VoicePipeline | null = null;

/**
 * POST /api/v1/voice/start
 * Start the voice pipeline
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    if (voicePipeline && voicePipeline.getState().isListening) {
      return res.json({
        success: true,
        message: 'Voice pipeline already running',
        state: voicePipeline.getState(),
      });
    }

    // Create new voice pipeline
    voicePipeline = new VoicePipeline({
      userId,
      picovoiceKey: process.env.PICOVOICE_ACCESS_KEY!,
      elevenLabsKey: process.env.ELEVENLABS_API_KEY,
      whisperModelPath: process.env.WHISPER_MODEL_PATH!,
      ollamaModel: process.env.OLLAMA_MODEL,
    });

    // Setup event handlers
    voicePipeline.on('wakeword', (data) => {
      console.log('Wake word detected:', data);
    });

    voicePipeline.on('transcription', (data) => {
      console.log('User said:', data.text);
    });

    voicePipeline.on('response', (data) => {
      console.log('RAGS responded:', data.text);
    });

    voicePipeline.on('error', (error) => {
      console.error('Voice pipeline error:', error);
    });

    // Start pipeline
    await voicePipeline.start();

    res.json({
      success: true,
      message: 'Voice pipeline started',
      state: voicePipeline.getState(),
    });
  } catch (error: any) {
    console.error('Failed to start voice pipeline:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/voice/stop
 * Stop the voice pipeline
 */
router.post('/stop', async (req: Request, res: Response) => {
  try {
    if (!voicePipeline) {
      return res.status(400).json({
        success: false,
        error: 'Voice pipeline not running',
      });
    }

    await voicePipeline.stop();
    voicePipeline = null;

    res.json({
      success: true,
      message: 'Voice pipeline stopped',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/voice/status
 * Get voice pipeline status
 */
router.get('/status', (req: Request, res: Response) => {
  if (!voicePipeline) {
    return res.json({
      success: true,
      running: false,
      state: null,
    });
  }

  res.json({
    success: true,
    running: true,
    state: voicePipeline.getState(),
  });
});

/**
 * POST /api/v1/voice/chat
 * Chat with AI (text-based, no voice)
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId and message are required',
      });
    }

    // Create brain and memory instances
    const brain = new OllamaBrain({
      model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
    });

    const memory = new MemorySystem(userId, brain);

    // Get context from memory
    const context = await memory.getContextForAI(message);

    // Generate response
    const response = await brain.chat(
      context ? `${context}\n\nUser: ${message}` : message
    );

    // Save to memory
    await memory.saveMessage('user', message);
    await memory.saveMessage('assistant', response);

    res.json({
      success: true,
      response,
      context: context ? 'Used memory context' : 'No context',
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/voice/remember
 * Store a memory
 */
router.post('/remember', async (req: Request, res: Response) => {
  try {
    const { userId, content, metadata, importance } = req.body;

    if (!userId || !content) {
      return res.status(400).json({
        success: false,
        error: 'userId and content are required',
      });
    }

    const brain = new OllamaBrain();
    const memory = new MemorySystem(userId, brain);

    await memory.remember(content, metadata || {}, importance || 5);

    res.json({
      success: true,
      message: 'Memory stored',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/voice/recall
 * Recall memories
 */
router.post('/recall', async (req: Request, res: Response) => {
  try {
    const { userId, query, limit } = req.body;

    if (!userId || !query) {
      return res.status(400).json({
        success: false,
        error: 'userId and query are required',
      });
    }

    const brain = new OllamaBrain();
    const memory = new MemorySystem(userId, brain);

    const memories = await memory.recall(query, limit || 5);

    res.json({
      success: true,
      memories,
      count: memories.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/voice/history
 * Get conversation history
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    const brain = new OllamaBrain();
    const memory = new MemorySystem(userId, brain);

    const history = await memory.getConversationHistory(
      limit ? parseInt(limit as string) : 20
    );

    res.json({
      success: true,
      history,
      count: history.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/voice/process
 * Process audio file and return AI response
 */
router.post('/process', async (req: Request, res: Response) => {
  try {
    const { text, audio } = req.body;

    // Use text if provided, otherwise would process audio
    const userMessage = text || 'Hello';
    console.log('📝 Processing message:', userMessage);

    // Use smart fallback for now (Ollama integration can be added later)
    const response = getSmartFallback(userMessage);
    console.log('💡 Response:', response);

    res.json({
      success: true,
      transcription: userMessage,
      response: response,
      timestamp: new Date().toISOString(),
      ollamaAvailable: false,
    });
  } catch (error: any) {
    console.error('❌ Voice process error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Smart fallback responses
function getSmartFallback(message: string): string {
  const input = message.toLowerCase();

  // Greetings
  if (input.match(/\b(hello|hi|hey|namaste|नमस्ते)\b/)) {
    return 'नमस्ते! मैं रैग्स हूँ। कैसे मदद कर सकता हूँ?';
  }

  // Time
  if (input.match(/\b(time|समय|टाइम|what time|kya time)\b/)) {
    const time = new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });
    return `अभी ${time} बज रहे हैं`;
  }

  // Date
  if (input.match(/\b(date|तारीख|day|आज|today)\b/)) {
    const date = new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    return `आज ${date} है`;
  }

  // Math
  const mathMatch = input.match(/(\d+)\s*([+\-*/x×÷])\s*(\d+)/);
  if (mathMatch) {
    const [, a, op, b] = mathMatch;
    const num1 = parseFloat(a);
    const num2 = parseFloat(b);
    let result = 0;

    switch (op) {
      case '+': result = num1 + num2; break;
      case '-': result = num1 - num2; break;
      case '*': case 'x': case '×': result = num1 * num2; break;
      case '/': case '÷': result = num1 / num2; break;
    }

    return `जवाब है ${result}`;
  }

  // Coding
  if (input.match(/\b(code|coding|program|python|javascript|java)\b/)) {
    return 'मैं कोडिंग में हेल्प कर सकता हूँ। पाइथन, जावास्क्रिप्ट, जावा सब आता है। क्या बनाना है?';
  }

  // Help
  if (input.match(/\b(help|मदद|what can you do|kya kar sakte)\b/)) {
    return 'मैं ये कर सकता हूँ - टाइम डेट बताना, मैथ कैलकुलेशन, कोडिंग हेल्प, जनरल क्वेश्चन। क्या चाहिए?';
  }

  // Thanks
  if (input.match(/\b(thank|thanks|धन्यवाद|shukriya)\b/)) {
    return 'आपका स्वागत है! कुछ और चाहिए तो बताइए';
  }

  // Default
  return `मैं समझ गया। अभी मैं बेसिक मोड में हूँ। टाइम, डेट, मैथ, कोडिंग में हेल्प कर सकता हूँ। Ollama चालू करें फुल AI के लिए।`;
}

export default router;

