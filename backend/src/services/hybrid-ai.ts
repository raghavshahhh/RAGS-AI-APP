/**
 * Hybrid AI Service
 * Combines Ollama (offline/privacy) + Gemini (online/internet)
 * Smart routing based on query type and availability
 */

import OllamaBrain from './ollama-brain';
import GeminiService from './gemini-service';

interface HybridAIConfig {
  mode: 'hybrid' | 'ollama' | 'gemini';
  ollamaConfig?: {
    baseUrl: string;
    model: string;
  };
  geminiConfig?: {
    apiKey: string;
    model?: string;
  };
  privacyMode?: boolean;
}

interface AIResponse {
  text: string;
  source: 'ollama' | 'gemini' | 'fallback';
  cached: boolean;
}

export class HybridAI {
  private ollama: OllamaBrain | null = null;
  private gemini: GeminiService | null = null;
  private config: HybridAIConfig;
  private responseCache: Map<string, string> = new Map();

  constructor(config: HybridAIConfig) {
    this.config = config;

    // Initialize Ollama (offline AI)
    if (config.mode === 'hybrid' || config.mode === 'ollama') {
      try {
        this.ollama = new OllamaBrain({
          baseUrl: config.ollamaConfig?.baseUrl || 'http://localhost:11434',
          model: config.ollamaConfig?.model || 'llama3.2:3b',
          temperature: 0.7,
          systemPrompt: this.getSystemPrompt(),
        });
        console.log('✅ Ollama initialized (offline AI)');
      } catch (error) {
        console.log('⚠️  Ollama not available');
      }
    }

    // Initialize Gemini (online AI)
    if (config.mode === 'hybrid' || config.mode === 'gemini') {
      if (config.geminiConfig?.apiKey) {
        try {
          this.gemini = new GeminiService({
            apiKey: config.geminiConfig.apiKey,
            model: config.geminiConfig.model || 'gemini-pro',
            temperature: 0.7,
          });
          console.log('✅ Gemini initialized (online AI)');
        } catch (error) {
          console.log('⚠️  Gemini not available');
        }
      }
    }
  }

  /**
   * Main chat method - intelligently routes to best AI
   */
  async chat(message: string): Promise<AIResponse> {
    // Check cache first
    const cached = this.responseCache.get(message.toLowerCase());
    if (cached) {
      return {
        text: cached,
        source: 'fallback',
        cached: true,
      };
    }

    // Determine if query needs internet
    const needsInternet = this.needsInternetAccess(message);

    // Privacy mode: always use Ollama if available
    if (this.config.privacyMode && this.ollama) {
      try {
        const response = await this.ollama.chat(message);
        return {
          text: response,
          source: 'ollama',
          cached: false,
        };
      } catch (error) {
        console.log('Ollama failed, trying fallback');
      }
    }

    // Hybrid mode: smart routing
    if (this.config.mode === 'hybrid') {
      // Use Gemini for internet queries
      if (needsInternet && this.gemini?.available) {
        try {
          const response = await this.gemini.searchAndAnswer(message);
          this.cacheResponse(message, response);
          return {
            text: response,
            source: 'gemini',
            cached: false,
          };
        } catch (error) {
          console.log('Gemini failed, trying Ollama');
        }
      }

      // Use Ollama for offline queries
      if (this.ollama) {
        try {
          const isAvailable = await this.ollama.isAvailable();
          if (isAvailable) {
            const response = await this.ollama.chat(message);
            this.cacheResponse(message, response);
            return {
              text: response,
              source: 'ollama',
              cached: false,
            };
          }
        } catch (error) {
          console.log('Ollama failed, trying Gemini');
        }
      }

      // Fallback to Gemini
      if (this.gemini?.available) {
        try {
          const response = await this.gemini.chat(message);
          this.cacheResponse(message, response);
          return {
            text: response,
            source: 'gemini',
            cached: false,
          };
        } catch (error) {
          console.log('Gemini also failed');
        }
      }
    }

    // Gemini-only mode
    if (this.config.mode === 'gemini' && this.gemini?.available) {
      try {
        const response = needsInternet 
          ? await this.gemini.searchAndAnswer(message)
          : await this.gemini.chat(message);
        this.cacheResponse(message, response);
        return {
          text: response,
          source: 'gemini',
          cached: false,
        };
      } catch (error) {
        console.log('Gemini failed');
      }
    }

    // Ollama-only mode
    if (this.config.mode === 'ollama' && this.ollama) {
      try {
        const response = await this.ollama.chat(message);
        this.cacheResponse(message, response);
        return {
          text: response,
          source: 'ollama',
          cached: false,
        };
      } catch (error) {
        console.log('Ollama failed');
      }
    }

    // Ultimate fallback
    const fallback = this.getFallbackResponse(message);
    return {
      text: fallback,
      source: 'fallback',
      cached: false,
    };
  }

  /**
   * Analyze image using Gemini Vision
   */
  async analyzeImage(imageData: string, prompt?: string): Promise<string> {
    if (this.gemini?.available) {
      return this.gemini.analyzeImage(imageData, prompt);
    }
    throw new Error('Image analysis requires Gemini API');
  }

  /**
   * Check if query needs internet access
   */
  private needsInternetAccess(message: string): boolean {
    const input = message.toLowerCase();
    
    // Keywords that indicate need for internet
    const internetKeywords = [
      'latest', 'news', 'current', 'today', 'weather', 'stock',
      'search', 'find', 'lookup', 'what is happening', 'recent',
      'ताज़ा', 'खबर', 'मौसम', 'आज', 'अभी',
    ];

    return internetKeywords.some(keyword => input.includes(keyword));
  }

  /**
   * Get system prompt
   */
  private getSystemPrompt(): string {
    return `You are RAGS - Raghav's AI General System, a personal AI assistant.

**Personality:**
- Helpful, friendly, and conversational
- Speak naturally in Hindi, English, or Hinglish
- Keep responses concise (2-3 sentences for voice)
- Be like a smart friend, not a robot

**Capabilities:**
- Answer questions (coding, math, science, general knowledge)
- Help with Mac system tasks
- Understand and respond in multiple languages
- Provide accurate, helpful information

**Privacy:**
- All conversations stay on this device
- No data sent to cloud (unless explicitly needed)
- User privacy is top priority

Be natural, be helpful, be RAGS! 🤖`;
  }

  /**
   * Get fallback response
   */
  private getFallbackResponse(message: string): string {
    const input = message.toLowerCase();
    
    // Greetings
    if (input.match(/\b(hello|hi|hey|namaste|नमस्ते)\b/)) {
      return 'नमस्ते! मैं रैग्स हूँ, आपका पर्सनल AI असिस्टेंट। कैसे मदद कर सकता हूँ?';
    }
    
    // Time
    if (input.match(/\b(time|समय|टाइम)\b/)) {
      const time = new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });
      return `अभी ${time} बज रहे हैं`;
    }
    
    // Date
    if (input.match(/\b(date|तारीख|day|आज)\b/)) {
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
    
    // Default
    return 'मैं समझ गया। अभी मैं बेसिक मोड में हूँ। Ollama या Gemini API सेटअप करें फुल AI के लिए।';
  }

  /**
   * Cache response
   */
  private cacheResponse(message: string, response: string): void {
    this.responseCache.set(message.toLowerCase(), response);
    
    // Keep cache size limited
    if (this.responseCache.size > 100) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.responseCache.clear();
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      mode: this.config.mode,
      ollama: this.ollama ? 'available' : 'not available',
      gemini: this.gemini?.available ? 'available' : 'not available',
      privacyMode: this.config.privacyMode,
      cacheSize: this.responseCache.size,
    };
  }
}

export default HybridAI;

