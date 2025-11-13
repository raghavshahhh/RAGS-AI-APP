/**
 * Real AI Routes - No Demo Data
 * All responses come from actual Ollama AI
 */

import { Router } from 'express';
import { RealAIIntegration } from '../services/real-ai-integration';
import { WebSocket } from 'ws';

const router = Router();

// Initialize Real AI (singleton)
let realAI: RealAIIntegration | null = null;
const connectedClients: Set<WebSocket> = new Set();

/**
 * Initialize Real AI system
 */
router.post('/initialize', async (req, res) => {
  try {
    const { userId, enableVision, enableTTS } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Create new Real AI instance
    realAI = new RealAIIntegration({
      userId,
      ollamaModel: process.env.OLLAMA_MODEL || 'phi3:mini',
      enableVision: enableVision === true, // Default false
      enableTTS: enableTTS === true // Default false
    });

    // Set up event listeners
    realAI.on('processing_start', () => {
      broadcastToClients({ type: 'processing_start' });
    });

    realAI.on('processing_end', () => {
      broadcastToClients({ type: 'processing_end' });
    });

    realAI.on('response', (response) => {
      broadcastToClients({
        type: 'ai_response',
        data: response
      });
    });

    realAI.on('speaking_start', (data) => {
      broadcastToClients({
        type: 'speaking_start',
        data: { text: data.text }
      });
    });

    realAI.on('user_context_update', (context) => {
      broadcastToClients({
        type: 'user_context',
        data: context
      });
    });

    // Initialize
    await realAI.initialize();

    res.json({
      success: true,
      message: 'Real AI initialized - No demo data!',
      features: {
        ollama: true,
        vision: enableVision !== false,
        tts: enableTTS !== false
      }
    });
  } catch (error: any) {
    console.error('Failed to initialize Real AI:', error);
    res.status(500).json({
      error: error.message,
      hint: error.message.includes('Ollama') ? 'Start Ollama with: ollama serve' : undefined
    });
  }
});

/**
 * Chat with Real AI
 */
router.post('/chat', async (req, res) => {
  try {
    if (!realAI) {
      return res.status(400).json({
        error: 'Real AI not initialized',
        hint: 'Call /api/real-ai/initialize first'
      });
    }

    const { message, userContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    console.log(`💬 User: ${message}`);

    // Process with REAL AI
    const response = await realAI.processMessage(message, userContext);

    console.log(`🤖 RAGS (${response.emotion}): ${response.text}`);

    // Execute backend actions automatically
    let actionResult = null;
    if (response.action) {
      const backendActions = ['remember', 'recall', 'open_app', 'open_file', 'volume_up', 'volume_down', 'volume_set', 'screenshot', 'notification', 'add_reminder', 'show_reminders', 'autopilot_start', 'autopilot_stop', 'web_search', 'wikipedia', 'register_face', 'camera_vision'];
      if (backendActions.includes(response.action.type)) {
        console.log(`🎬 Executing backend action: ${response.action.type}`);
        actionResult = await realAI.executeAction(response.action);
        console.log(`✅ Action result:`, actionResult);
        
        // For recall, update response text with recalled memories
        if (response.action.type === 'recall' && actionResult.success) {
          response.text = actionResult.message || response.text;
        }
      }
    }

    res.json({
      success: true,
      response: {
        text: response.text,
        emotion: response.emotion,
        confidence: response.confidence,
        reasoning: response.reasoning,
        shouldSpeak: response.shouldSpeak,
        action: response.action
      },
      actionResult,
      context: realAI.getContext()
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update user context (from camera/face tracking)
 */
router.post('/update-user-context', async (req, res) => {
  try {
    if (!realAI) {
      return res.status(400).json({ error: 'Real AI not initialized' });
    }

    const { visible, position, expression } = req.body;

    realAI.updateUserVisibility(
      visible !== false,
      position,
      expression
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get current AI context
 */
router.get('/context', (req, res) => {
  if (!realAI) {
    return res.status(400).json({ error: 'Real AI not initialized' });
  }

  res.json({
    success: true,
    context: realAI.getContext()
  });
});

/**
 * Get conversation summary
 */
router.get('/summary', async (req, res) => {
  try {
    if (!realAI) {
      return res.status(400).json({ error: 'Real AI not initialized' });
    }

    const summary = await realAI.getConversationSummary();

    res.json({
      success: true,
      summary
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Clear conversation history
 */
router.post('/clear-history', (req, res) => {
  if (!realAI) {
    return res.status(400).json({ error: 'Real AI not initialized' });
  }

  realAI.clearHistory();

  res.json({
    success: true,
    message: 'Conversation history cleared'
  });
});

/**
 * Set voice configuration
 */
router.post('/set-voice', async (req, res) => {
  try {
    if (!realAI) {
      return res.status(400).json({ error: 'Real AI not initialized' });
    }

    const { gender, voice, language } = req.body;

    await realAI.setVoiceConfig({ gender, voice, language });

    res.json({
      success: true,
      message: `Voice changed to ${gender || 'default'} voice`,
      config: { gender, voice, language }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get available voices
 */
router.get('/voices', async (req, res) => {
  try {
    if (!realAI) {
      return res.status(400).json({ error: 'Real AI not initialized' });
    }

    const voices = await realAI.getAvailableVoices();

    res.json({
      success: true,
      voices
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get AI status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    initialized: realAI !== null,
    connectedClients: connectedClients.size,
    features: realAI ? {
      vision: true,
      tts: true,
      ollama: true
    } : null
  });
});

/**
 * Broadcast message to all connected WebSocket clients
 */
function broadcastToClients(message: any) {
  const data = JSON.stringify(message);
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

/**
 * Register WebSocket client
 */
export function registerWebSocketClient(ws: WebSocket) {
  connectedClients.add(ws);
  
  ws.on('close', () => {
    connectedClients.delete(ws);
  });

  // Send initial status
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to Real AI',
    initialized: realAI !== null
  }));
}

export default router;

