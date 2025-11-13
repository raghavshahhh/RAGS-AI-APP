import { Router, Request, Response } from 'express';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

const router = Router();

// Ollama configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const VISION_MODEL = 'llama3.2-vision:latest'; // Ollama vision model

/**
 * Analyze image with Ollama Vision AI
 * Detects faces, emotions, expressions, objects, and scene
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { image, prompt } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image data required',
      });
    }

    console.log('🔍 Analyzing image with Ollama Vision AI...');

    // Convert base64 to buffer if needed
    let imageData = image;
    if (image.startsWith('data:image')) {
      imageData = image.split(',')[1];
    }

    // Default prompt for comprehensive analysis
    const analysisPrompt = prompt || `Analyze this image in detail. Describe:
1. Any people/faces visible and their emotions/expressions
2. Objects and items in the scene
3. Overall mood and atmosphere
4. Any text or important details
Respond in Hinglish (Hindi + English mix) naturally.`;

    try {
      // Call Ollama Vision API
      const response = await axios.post(
        `${OLLAMA_URL}/api/generate`,
        {
          model: VISION_MODEL,
          prompt: analysisPrompt,
          images: [imageData],
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 300,
          },
        },
        {
          timeout: 30000, // 30 second timeout
        }
      );

      const description = response.data.response.trim();

      console.log('✅ Vision analysis complete');

      res.json({
        success: true,
        description,
        model: VISION_MODEL,
        timestamp: new Date().toISOString(),
      });
    } catch (ollamaError: any) {
      console.error('❌ Ollama Vision error:', ollamaError.message);

      // Fallback: Try to detect if Ollama is not running
      if (ollamaError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          error: 'Ollama is not running. Please start Ollama with: ollama serve',
          suggestion: `Then pull the vision model: ollama pull ${VISION_MODEL}`,
        });
      }

      // Fallback: Model not found
      if (ollamaError.response?.status === 404) {
        return res.status(404).json({
          success: false,
          error: `Vision model not found. Please pull it first: ollama pull ${VISION_MODEL}`,
        });
      }

      throw ollamaError;
    }
  } catch (error: any) {
    console.error('❌ Vision analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Analyze image for face emotions specifically
 */
router.post('/analyze-emotion', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image data required',
      });
    }

    console.log('😊 Analyzing facial emotions with Ollama Vision AI...');

    // Convert base64 to buffer if needed
    let imageData = image;
    if (image.startsWith('data:image')) {
      imageData = image.split(',')[1];
    }

    const emotionPrompt = `Look at this image and analyze the person's face and emotions. Describe:
1. Facial expression (happy, sad, angry, surprised, neutral, thinking, etc.)
2. Eye expression and gaze direction
3. Mouth position and smile/frown
4. Overall emotional state
5. Confidence level of your analysis
Respond in Hinglish naturally. Be specific and detailed.`;

    try {
      const response = await axios.post(
        `${OLLAMA_URL}/api/generate`,
        {
          model: VISION_MODEL,
          prompt: emotionPrompt,
          images: [imageData],
          stream: false,
          options: {
            temperature: 0.5, // Lower temperature for more consistent emotion detection
            num_predict: 200,
          },
        },
        {
          timeout: 30000,
        }
      );

      const analysis = response.data.response.trim();

      // Extract emotion from analysis (simple keyword matching)
      const emotions = {
        happy: ['happy', 'smiling', 'smile', 'khush', 'muskura'],
        sad: ['sad', 'unhappy', 'udaas', 'dukhi'],
        angry: ['angry', 'gussa', 'frustrated'],
        surprised: ['surprised', 'shocked', 'hairan'],
        neutral: ['neutral', 'normal', 'calm'],
        thinking: ['thinking', 'soch', 'confused'],
        excited: ['excited', 'enthusiastic', 'josh'],
      };

      let detectedEmotion = 'neutral';
      let maxMatches = 0;

      for (const [emotion, keywords] of Object.entries(emotions)) {
        const matches = keywords.filter((keyword) =>
          analysis.toLowerCase().includes(keyword)
        ).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          detectedEmotion = emotion;
        }
      }

      console.log(`✅ Detected emotion: ${detectedEmotion}`);

      res.json({
        success: true,
        emotion: detectedEmotion,
        confidence: maxMatches > 0 ? Math.min(maxMatches * 0.3, 0.95) : 0.5,
        analysis,
        model: VISION_MODEL,
        timestamp: new Date().toISOString(),
      });
    } catch (ollamaError: any) {
      console.error('❌ Ollama emotion detection error:', ollamaError.message);

      if (ollamaError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          error: 'Ollama is not running. Please start Ollama with: ollama serve',
        });
      }

      throw ollamaError;
    }
  } catch (error: any) {
    console.error('❌ Emotion analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Continuous face tracking endpoint
 * For real-time emotion detection from video stream
 */
router.post('/track-face', async (req: Request, res: Response) => {
  try {
    const { image, previousEmotion } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image data required',
      });
    }

    console.log('👁️ Real-time face tracking...');

    let imageData = image;
    if (image.startsWith('data:image')) {
      imageData = image.split(',')[1];
    }

    const trackingPrompt = `Quick analysis: Look at the person's face and tell me their current emotion in one word (happy/sad/angry/surprised/neutral/thinking/excited). ${
      previousEmotion ? `Previous emotion was: ${previousEmotion}` : ''
    }`;

    try {
      const response = await axios.post(
        `${OLLAMA_URL}/api/generate`,
        {
          model: VISION_MODEL,
          prompt: trackingPrompt,
          images: [imageData],
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 50, // Quick response
          },
        },
        {
          timeout: 10000, // Faster timeout for real-time
        }
      );

      const result = response.data.response.trim().toLowerCase();

      // Extract emotion from response
      const emotionMap: { [key: string]: string } = {
        happy: 'happy',
        sad: 'sad',
        angry: 'angry',
        surprised: 'surprised',
        neutral: 'neutral',
        thinking: 'thinking',
        excited: 'excited',
        khush: 'happy',
        udaas: 'sad',
        gussa: 'angry',
      };

      let detectedEmotion = 'neutral';
      for (const [keyword, emotion] of Object.entries(emotionMap)) {
        if (result.includes(keyword)) {
          detectedEmotion = emotion;
          break;
        }
      }

      res.json({
        success: true,
        emotion: detectedEmotion,
        rawResponse: result,
        timestamp: new Date().toISOString(),
      });
    } catch (ollamaError: any) {
      // For real-time tracking, return previous emotion on error
      res.json({
        success: true,
        emotion: previousEmotion || 'neutral',
        error: 'Using previous emotion due to analysis error',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
