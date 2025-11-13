/**
 * 🎭 ENHANCED CHAT API ROUTES
 * ChatGPT-level smooth conversation with streaming responses
 */

import { Router, Request, Response } from 'express';
import EnhancedConversationEngine from '../services/enhanced-conversation-engine';
import EnhancedVoicePipeline from '../services/enhanced-voice-pipeline';
import { performanceMonitor } from '../services/performance-monitor';

const router = Router();

// Initialize enhanced services
const conversationEngine = new EnhancedConversationEngine();
const voicePipeline = new EnhancedVoicePipeline();

// Initialize voice pipeline
voicePipeline.initialize({
  voice: 'en-IN-PrabhatNeural',
  speed: 1.0,
  enableBreathing: true,
  enableFillers: true,
  interruptionSensitivity: 0.7
});

/**
 * POST /api/enhanced-chat/initialize
 * Initialize enhanced conversation context
 */
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const { userId, personalityMode = 'jarvis' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    await conversationEngine.initializeContext(userId, personalityMode);

    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime);

    res.json({
      success: true,
      message: `Enhanced conversation initialized for ${userId}`,
      personalityMode,
      features: {
        streaming: true,
        contextMemory: true,
        emotionDetection: true,
        voiceEnhancement: true,
        interruption: true
      },
      responseTime
    });

    console.log(`🎭 Enhanced conversation initialized for ${userId} in ${personalityMode} mode`);

  } catch (error) {
    console.error('Enhanced chat initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize enhanced conversation',
      message: error.message
    });
  }
});

/**
 * POST /api/enhanced-chat/stream
 * Streaming conversation with natural flow
 */
router.post('/stream', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const { userId, message, enableVoice = false } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId and message are required'
      });
    }

    // Set up Server-Sent Events for streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial response
    res.write(`data: ${JSON.stringify({
      type: 'start',
      message: 'Processing your message...',
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Process message with streaming response
    const responseStream = await conversationEngine.processMessage(userId, message);
    let fullResponse = '';
    let voiceChunks: string[] = [];

    for await (const chunk of responseStream) {
      // Send chunk to client
      res.write(`data: ${JSON.stringify({
        type: 'chunk',
        text: chunk.text,
        emotion: chunk.emotion,
        confidence: chunk.confidence,
        shouldPause: chunk.shouldPause,
        fillerWord: chunk.fillerWord,
        isComplete: chunk.isComplete,
        timestamp: new Date().toISOString()
      })}\n\n`);

      // Collect for voice synthesis
      if (chunk.text && enableVoice) {
        voiceChunks.push(chunk.text);
        fullResponse += chunk.text;
      }

      // If complete, break
      if (chunk.isComplete) {
        break;
      }
    }

    // Send completion
    const responseTime = Date.now() - startTime;
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      fullResponse,
      responseTime,
      timestamp: new Date().toISOString()
    })}\n\n`);

    res.write('data: [DONE]\n\n');
    res.end();

    // Start voice synthesis if enabled
    if (enableVoice && fullResponse) {
      try {
        const emotion = conversationEngine.getContext(userId)?.currentMood || 'neutral';
        await voicePipeline.speak(fullResponse, emotion);
      } catch (voiceError) {
        console.error('Voice synthesis error:', voiceError);
      }
    }

    performanceMonitor.recordRequest(responseTime);
    console.log(`✅ Enhanced streaming chat completed for ${userId} (${responseTime}ms)`);

  } catch (error) {
    console.error('Enhanced streaming chat error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: 'Failed to process message',
      message: error.message,
      timestamp: new Date().toISOString()
    })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/enhanced-chat/chat
 * Regular chat (non-streaming) with enhancements
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const { userId, message, enableVoice = false } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId and message are required'
      });
    }

    // Process message and collect full response
    const responseStream = await conversationEngine.processMessage(userId, message);
    let fullResponse = '';
    let emotion = 'neutral';
    let confidence = 0;

    for await (const chunk of responseStream) {
      fullResponse += chunk.text;
      emotion = chunk.emotion;
      confidence = chunk.confidence;
      
      if (chunk.isComplete) break;
    }

    const responseTime = Date.now() - startTime;
    
    // Start voice synthesis if enabled
    if (enableVoice && fullResponse) {
      try {
        voicePipeline.speak(fullResponse, emotion);
      } catch (voiceError) {
        console.error('Voice synthesis error:', voiceError);
      }
    }

    performanceMonitor.recordRequest(responseTime);

    res.json({
      success: true,
      response: {
        text: fullResponse,
        emotion,
        confidence,
        shouldSpeak: enableVoice
      },
      context: {
        userId,
        personalityMode: conversationEngine.getContext(userId)?.personalityMode,
        currentMood: conversationEngine.getContext(userId)?.currentMood
      },
      responseTime,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Enhanced chat completed for ${userId} (${responseTime}ms)`);

  } catch (error) {
    console.error('Enhanced chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/enhanced-chat/interrupt
 * Interrupt current response (for voice interruptions)
 */
router.post('/interrupt', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    // Stop streaming response
    conversationEngine.stopStreaming();
    
    // Stop voice synthesis
    voicePipeline.stopSpeaking();

    res.json({
      success: true,
      message: 'Response interrupted successfully',
      timestamp: new Date().toISOString()
    });

    console.log(`🛑 Response interrupted for ${userId}`);

  } catch (error) {
    console.error('Interrupt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to interrupt response',
      message: error.message
    });
  }
});

/**
 * POST /api/enhanced-chat/personality
 * Switch personality mode
 */
router.post('/personality', async (req: Request, res: Response) => {
  try {
    const { userId, personality } = req.body;

    if (!userId || !personality) {
      return res.status(400).json({
        success: false,
        error: 'userId and personality are required'
      });
    }

    const validPersonalities = ['work', 'chill', 'teacher', 'coach', 'jarvis'];
    if (!validPersonalities.includes(personality)) {
      return res.status(400).json({
        success: false,
        error: `Invalid personality. Must be one of: ${validPersonalities.join(', ')}`
      });
    }

    conversationEngine.switchPersonality(userId, personality);

    res.json({
      success: true,
      message: `Switched to ${personality} mode`,
      personality,
      timestamp: new Date().toISOString()
    });

    console.log(`🎭 Personality switched to ${personality} for ${userId}`);

  } catch (error) {
    console.error('Personality switch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to switch personality',
      message: error.message
    });
  }
});

/**
 * GET /api/enhanced-chat/context/:userId
 * Get conversation context
 */
router.get('/context/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const context = conversationEngine.getContext(userId);

    if (!context) {
      return res.status(404).json({
        success: false,
        error: 'Context not found. Initialize conversation first.'
      });
    }

    res.json({
      success: true,
      context: {
        userId: context.userId,
        personalityMode: context.personalityMode,
        currentMood: context.currentMood,
        messageCount: context.messages.length,
        lastInteraction: context.lastInteraction,
        userPreferences: context.userPreferences
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Context retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve context',
      message: error.message
    });
  }
});

/**
 * POST /api/enhanced-chat/preferences
 * Update user preferences
 */
router.post('/preferences', async (req: Request, res: Response) => {
  try {
    const { userId, preferences } = req.body;

    if (!userId || !preferences) {
      return res.status(400).json({
        success: false,
        error: 'userId and preferences are required'
      });
    }

    conversationEngine.updatePreferences(userId, preferences);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences,
      timestamp: new Date().toISOString()
    });

    console.log(`⚙️ Preferences updated for ${userId}`);

  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
      message: error.message
    });
  }
});

/**
 * GET /api/enhanced-chat/voice/status
 * Get voice pipeline status
 */
router.get('/voice/status', async (req: Request, res: Response) => {
  try {
    const status = voicePipeline.getStatus();

    res.json({
      success: true,
      voice: {
        ...status,
        available: true,
        engine: 'Edge TTS',
        voice: 'en-IN-PrabhatNeural'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Voice status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get voice status',
      message: error.message
    });
  }
});

/**
 * POST /api/enhanced-chat/voice/speak
 * Speak text with enhanced voice
 */
router.post('/voice/speak', async (req: Request, res: Response) => {
  try {
    const { text, emotion = 'neutral' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'text is required'
      });
    }

    await voicePipeline.speak(text, emotion);

    res.json({
      success: true,
      message: 'Speech started',
      text,
      emotion,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Voice speak error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to speak text',
      message: error.message
    });
  }
});

/**
 * POST /api/enhanced-chat/voice/stop
 * Stop current speech
 */
router.post('/voice/stop', async (req: Request, res: Response) => {
  try {
    voicePipeline.stopSpeaking();

    res.json({
      success: true,
      message: 'Speech stopped',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Voice stop error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop speech',
      message: error.message
    });
  }
});

export default router;
