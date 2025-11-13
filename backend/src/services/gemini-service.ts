/**
 * Google Gemini AI Service
 * Provides online AI capabilities with internet access
 * Privacy-focused: Only sends data when explicitly needed
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private config: GeminiConfig;
  private chatHistory: ChatMessage[] = [];
  private isAvailable: boolean = false;

  constructor(config: GeminiConfig) {
    this.config = {
      model: config.model || 'gemini-pro',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1024,
      ...config,
    };

    if (config.apiKey && config.apiKey !== 'your_gemini_api_key') {
      try {
        this.genAI = new GoogleGenerativeAI(config.apiKey);
        this.model = this.genAI.getGenerativeModel({ 
          model: this.config.model!,
        });
        this.isAvailable = true;
        console.log('✅ Gemini AI initialized');
      } catch (error) {
        console.error('❌ Gemini initialization failed:', error);
        this.isAvailable = false;
      }
    } else {
      console.log('⚠️  Gemini API key not configured');
      this.isAvailable = false;
    }
  }

  /**
   * Check if Gemini is available
   */
  async checkAvailability(): Promise<boolean> {
    if (!this.isAvailable || !this.model) {
      return false;
    }

    try {
      // Quick test
      const result = await this.model.generateContent('Hi');
      return true;
    } catch (error) {
      console.error('Gemini availability check failed:', error);
      return false;
    }
  }

  /**
   * Chat with Gemini (with context)
   */
  async chat(message: string, systemPrompt?: string): Promise<string> {
    if (!this.isAvailable || !this.model) {
      throw new Error('Gemini not available');
    }

    try {
      // Build conversation history
      const history = this.chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      // Create chat session
      const chat = this.model.startChat({
        history,
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
        },
      });

      // Add system prompt if provided
      const fullMessage = systemPrompt 
        ? `${systemPrompt}\n\nUser: ${message}`
        : message;

      // Send message
      const result = await chat.sendMessage(fullMessage);
      const response = result.response.text();

      // Update history
      this.chatHistory.push({ role: 'user', content: message });
      this.chatHistory.push({ role: 'assistant', content: response });

      // Keep only last 10 messages
      if (this.chatHistory.length > 20) {
        this.chatHistory = this.chatHistory.slice(-20);
      }

      return response;
    } catch (error: any) {
      console.error('Gemini chat error:', error);
      throw new Error(`Gemini error: ${error.message}`);
    }
  }

  /**
   * One-shot generation (no context)
   */
  async generate(prompt: string): Promise<string> {
    if (!this.isAvailable || !this.model) {
      throw new Error('Gemini not available');
    }

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.error('Gemini generate error:', error);
      throw new Error(`Gemini error: ${error.message}`);
    }
  }

  /**
   * Search web and answer (Gemini has internet access)
   */
  async searchAndAnswer(query: string): Promise<string> {
    const prompt = `Search the internet and answer this question with latest information: ${query}
    
Provide a concise answer (2-3 sentences) in Hindi/English mix (Hinglish) for voice conversation.`;

    return this.generate(prompt);
  }

  /**
   * Analyze image (Gemini Pro Vision)
   */
  async analyzeImage(imageData: string, prompt: string = 'What do you see?'): Promise<string> {
    if (!this.isAvailable || !this.genAI) {
      throw new Error('Gemini not available');
    }

    try {
      // Use Gemini Pro Vision
      const visionModel = this.genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
      
      const result = await visionModel.generateContent([
        prompt,
        {
          inlineData: {
            data: imageData,
            mimeType: 'image/jpeg',
          },
        },
      ]);

      return result.response.text();
    } catch (error: any) {
      console.error('Gemini vision error:', error);
      throw new Error(`Gemini vision error: ${error.message}`);
    }
  }

  /**
   * Clear chat history
   */
  clearHistory(): void {
    this.chatHistory = [];
  }

  /**
   * Get chat history
   */
  getHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  /**
   * Check if service is available
   */
  get available(): boolean {
    return this.isAvailable;
  }
}

export default GeminiService;

