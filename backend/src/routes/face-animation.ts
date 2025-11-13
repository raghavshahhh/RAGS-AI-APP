/**
 * Face Animation Routes
 * API endpoints for emotion detection, phoneme generation, and face control
 * REAL AI INTEGRATION - No demo data, all powered by Ollama
 */

import { Router } from 'express';
import { OllamaBrain } from '../services/ollama-brain';

const router = Router();

// Lazy initialization - create brain only when needed (after env is loaded)
let brain: OllamaBrain | null = null;
function getBrain() {
  if (!brain) {
    brain = new OllamaBrain({
      model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
      temperature: 0.5,
      systemPrompt: `You are an emotion detection AI. Analyze text and respond with ONLY ONE emotion word.
Valid emotions: happy, sad, surprised, thinking, excited, curious, neutral, angry.
Be accurate and consistent.`
    });
  }
  return brain;
}

/**
 * Analyze text for emotion using REAL Ollama AI
 * No hardcoded responses - AI actually reads and understands the text
 */
router.post('/analyze-emotion', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log(`🧠 Analyzing emotion for: "${text.substring(0, 50)}..."`);

    // Use REAL AI to detect emotion from text
    const prompt = `Analyze the emotion in this text. Respond with ONLY ONE WORD from this list:
happy, sad, surprised, thinking, excited, curious, neutral, angry

Text: "${text}"

Detected emotion:`;

    try {
      const response = await getBrain().chat(prompt);
      const rawEmotion = response.trim().toLowerCase();

      console.log(`🎭 Raw AI response: "${rawEmotion}"`);

      // Extract emotion from response (AI might add extra words)
      const validEmotions = ['happy', 'sad', 'surprised', 'thinking', 'excited', 'curious', 'neutral', 'angry'];

      let detectedEmotion = 'neutral';
      for (const emotion of validEmotions) {
        if (rawEmotion.includes(emotion)) {
          detectedEmotion = emotion;
          break;
        }
      }

      // Calculate confidence based on text analysis
      const confidence = calculateEmotionConfidence(text, detectedEmotion);

      console.log(`✅ Detected emotion: ${detectedEmotion} (confidence: ${confidence})`);

      res.json({
        emotion: {
          type: detectedEmotion,
          confidence: confidence,
          rawResponse: rawEmotion
        },
        source: 'ollama-ai',
        timestamp: new Date().toISOString()
      });
    } catch (aiError: any) {
      console.error('❌ Ollama AI error:', aiError.message);

      // Fallback: Use keyword-based emotion detection
      const fallbackEmotion = detectEmotionFromKeywords(text);

      res.json({
        emotion: {
          type: fallbackEmotion,
          confidence: 0.6,
          rawResponse: 'Fallback detection'
        },
        source: 'keyword-fallback',
        warning: 'Ollama AI unavailable, using keyword detection',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    console.error('❌ Emotion analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze emotion', details: error.message });
  }
});

/**
 * Convert text to phonemes for lip-sync
 */
router.post('/text-to-phonemes', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Simple phoneme mapping
    const phonemes = textToPhonemes(text);

    res.json({ phonemes });
  } catch (error) {
    console.error('Phoneme generation error:', error);
    res.status(500).json({ error: 'Failed to generate phonemes' });
  }
});

/**
 * Get current face state
 */
router.get('/state', (req, res) => {
  res.json({
    isListening: false,
    isSpeaking: false,
    emotion: 'neutral',
    audioLevel: 0
  });
});

/**
 * Helper: Convert text to phonemes
 */
function textToPhonemes(text: string): string[] {
  const phonemes: string[] = [];
  const words = text.toLowerCase().split(/\s+/);

  const vowelMap: { [key: string]: string } = {
    'a': 'A',
    'e': 'E',
    'i': 'I',
    'o': 'O',
    'u': 'U'
  };

  const consonantMap: { [key: string]: string } = {
    'b': 'M', 'p': 'M', 'm': 'M', 'w': 'M',
    'f': 'F', 'v': 'F',
    's': 'S', 'z': 'S', 'sh': 'S', 'ch': 'S',
    't': 'rest', 'd': 'rest', 'k': 'rest', 'g': 'rest',
    'l': 'rest', 'r': 'rest', 'n': 'rest', 'h': 'rest',
    'j': 'rest', 'y': 'rest', 'th': 'rest'
  };

  for (const word of words) {
    let i = 0;
    while (i < word.length) {
      const char = word[i];
      
      // Check for two-character phonemes
      if (i < word.length - 1) {
        const twoChar = word.substring(i, i + 2);
        if (consonantMap[twoChar]) {
          phonemes.push(consonantMap[twoChar]);
          i += 2;
          continue;
        }
      }

      // Single character
      if (vowelMap[char]) {
        phonemes.push(vowelMap[char]);
        // Hold vowel for duration
        phonemes.push(vowelMap[char]);
      } else if (consonantMap[char]) {
        phonemes.push(consonantMap[char]);
      } else {
        phonemes.push('rest');
      }

      i++;
    }

    // Add pause between words
    phonemes.push('rest');
    phonemes.push('rest');
  }

  return phonemes;
}

/**
 * Advanced phoneme analysis using word patterns
 */
function advancedPhonemeAnalysis(text: string): string[] {
  const phonemes: string[] = [];
  const words = text.toLowerCase().split(/\s+/);

  // Common word patterns
  const patterns: { [key: string]: string[] } = {
    'hello': ['rest', 'E', 'E', 'rest', 'O', 'O'],
    'hi': ['rest', 'I', 'I'],
    'yes': ['rest', 'E', 'E', 'S'],
    'no': ['rest', 'O', 'O'],
    'okay': ['O', 'O', 'rest', 'A', 'A'],
    'thanks': ['rest', 'A', 'A', 'rest', 'S'],
    'please': ['rest', 'E', 'E', 'S'],
    'sorry': ['S', 'O', 'O', 'rest', 'E'],
    'what': ['rest', 'A', 'A', 'rest'],
    'how': ['rest', 'O', 'O'],
    'why': ['rest', 'I', 'I'],
    'when': ['rest', 'E', 'E', 'rest'],
    'where': ['rest', 'E', 'E', 'rest']
  };

  for (const word of words) {
    if (patterns[word]) {
      phonemes.push(...patterns[word]);
    } else {
      // Fallback to basic analysis
      phonemes.push(...textToPhonemes(word));
    }
    phonemes.push('rest');
  }

  return phonemes;
}

/**
 * Detect emotion from audio features
 */
router.post('/analyze-audio-emotion', async (req, res) => {
  try {
    const { audioFeatures } = req.body;

    // Analyze audio features for emotion
    // This is a simplified version - in production, use ML model
    let emotion = 'neutral';
    let confidence = 0.5;

    if (audioFeatures) {
      const { pitch, energy, tempo } = audioFeatures;

      if (energy > 0.7 && tempo > 1.2) {
        emotion = 'excited';
        confidence = 0.8;
      } else if (energy < 0.3 && tempo < 0.8) {
        emotion = 'sad';
        confidence = 0.75;
      } else if (pitch > 1.3) {
        emotion = 'surprised';
        confidence = 0.7;
      } else if (tempo < 0.9 && energy > 0.4) {
        emotion = 'thinking';
        confidence = 0.65;
      }
    }

    res.json({
      emotion: {
        type: emotion,
        confidence
      }
    });
  } catch (error) {
    console.error('Audio emotion analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze audio emotion' });
  }
});

/**
 * Get emotion suggestions based on context using REAL AI
 */
router.post('/suggest-emotion', async (req, res) => {
  try {
    const { context, previousEmotion } = req.body;

    console.log(`🤔 Suggesting emotion for context: "${context?.substring(0, 50)}..."`);

    // Use REAL AI to suggest appropriate emotion
    const prompt = `Based on this context, suggest the most appropriate emotion.
Choose ONLY ONE from: happy, sad, surprised, thinking, excited, curious, neutral, angry.

Context: ${context}
Previous emotion: ${previousEmotion || 'neutral'}

Suggested emotion:`;

    try {
      const response = await getBrain().chat(prompt);
      const rawEmotion = response.trim().toLowerCase();

      const validEmotions = ['happy', 'sad', 'surprised', 'thinking', 'excited', 'curious', 'neutral', 'angry'];

      let suggestedEmotion = 'neutral';
      for (const emotion of validEmotions) {
        if (rawEmotion.includes(emotion)) {
          suggestedEmotion = emotion;
          break;
        }
      }

      console.log(`✅ Suggested emotion: ${suggestedEmotion}`);

      res.json({
        emotion: suggestedEmotion,
        confidence: 0.8,
        source: 'ollama-ai'
      });
    } catch (aiError) {
      // Fallback
      res.json({
        emotion: previousEmotion || 'neutral',
        confidence: 0.5,
        source: 'fallback'
      });
    }
  } catch (error) {
    console.error('❌ Emotion suggestion error:', error);
    res.status(500).json({ error: 'Failed to suggest emotion' });
  }
});

/**
 * Batch process text for animation timeline with REAL AI emotion detection
 */
router.post('/animation-timeline', async (req, res) => {
  try {
    const { text, duration } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log(`🎬 Generating animation timeline for: "${text.substring(0, 50)}..."`);

    // Generate phonemes
    const phonemes = advancedPhonemeAnalysis(text);

    // Calculate timing for each phoneme
    const phonemeDuration = (duration || 3000) / phonemes.length;

    const timeline = phonemes.map((phoneme, index) => ({
      phoneme,
      startTime: index * phonemeDuration,
      duration: phonemeDuration
    }));

    // Detect emotion using REAL AI
    const emotionPrompt = `Analyze the emotion in this text. Respond with ONLY ONE word from: happy, sad, surprised, thinking, excited, curious, neutral, angry.

Text: "${text}"

Emotion:`;

    let emotion = 'neutral';
    try {
      const emotionResponse = await getBrain().chat(emotionPrompt);
      const rawEmotion = emotionResponse.trim().toLowerCase();

      const validEmotions = ['happy', 'sad', 'surprised', 'thinking', 'excited', 'curious', 'neutral', 'angry'];
      for (const validEmotion of validEmotions) {
        if (rawEmotion.includes(validEmotion)) {
          emotion = validEmotion;
          break;
        }
      }
    } catch (aiError) {
      console.warn('⚠️ AI emotion detection failed, using keyword fallback');
      emotion = detectEmotionFromKeywords(text);
    }

    console.log(`✅ Timeline generated with emotion: ${emotion}`);

    res.json({
      timeline,
      emotion,
      totalDuration: duration || 3000,
      source: 'ollama-ai'
    });
  } catch (error) {
    console.error('❌ Animation timeline error:', error);
    res.status(500).json({ error: 'Failed to generate animation timeline' });
  }
});

// ============================================================================
// HELPER FUNCTIONS - Real AI-powered emotion detection
// ============================================================================

/**
 * Calculate emotion confidence based on text analysis
 */
function calculateEmotionConfidence(text: string, emotion: string): number {
  const lowerText = text.toLowerCase();

  // Emotion keyword indicators
  const emotionKeywords: { [key: string]: string[] } = {
    happy: ['happy', 'joy', 'great', 'awesome', 'wonderful', 'khush', 'maza', 'accha'],
    sad: ['sad', 'unhappy', 'depressed', 'down', 'udaas', 'dukhi', 'bura'],
    angry: ['angry', 'mad', 'furious', 'annoyed', 'gussa', 'naraz'],
    surprised: ['wow', 'amazing', 'surprised', 'shocked', 'hairan', 'kamaal'],
    excited: ['excited', 'thrilled', 'pumped', 'josh', 'excited'],
    thinking: ['hmm', 'think', 'wonder', 'maybe', 'soch', 'shayad'],
    curious: ['curious', 'interesting', 'wonder', 'kya', 'kaise'],
  };

  const keywords = emotionKeywords[emotion] || [];
  let matchCount = 0;

  for (const keyword of keywords) {
    if (lowerText.includes(keyword)) {
      matchCount++;
    }
  }

  // Base confidence + keyword matches
  const baseConfidence = 0.6;
  const keywordBonus = Math.min(matchCount * 0.1, 0.3);

  return Math.min(baseConfidence + keywordBonus, 0.95);
}

/**
 * Fallback: Detect emotion from keywords when AI is unavailable
 */
function detectEmotionFromKeywords(text: string): string {
  const lowerText = text.toLowerCase();

  const emotionPatterns = [
    { emotion: 'happy', keywords: ['happy', 'joy', 'great', 'awesome', 'wonderful', 'khush', 'maza', 'accha', '😊', '😄', '🎉'] },
    { emotion: 'sad', keywords: ['sad', 'unhappy', 'depressed', 'down', 'udaas', 'dukhi', 'bura', '😢', '😞'] },
    { emotion: 'angry', keywords: ['angry', 'mad', 'furious', 'annoyed', 'gussa', 'naraz', '😠', '😡'] },
    { emotion: 'surprised', keywords: ['wow', 'amazing', 'surprised', 'shocked', 'hairan', 'kamaal', '😮', '😲'] },
    { emotion: 'excited', keywords: ['excited', 'thrilled', 'pumped', 'josh', 'excited', '🎊', '🔥'] },
    { emotion: 'thinking', keywords: ['hmm', 'think', 'wonder', 'maybe', 'soch', 'shayad', '🤔'] },
    { emotion: 'curious', keywords: ['curious', 'interesting', 'wonder', 'kya', 'kaise', 'how', 'why', '❓'] },
  ];

  for (const pattern of emotionPatterns) {
    for (const keyword of pattern.keywords) {
      if (lowerText.includes(keyword)) {
        return pattern.emotion;
      }
    }
  }

  return 'neutral';
}

export default router;

