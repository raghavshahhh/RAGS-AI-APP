// ============================================================================
// RAGS AI - Ollama Local LLM Brain (Offline AI)
// ============================================================================

import axios, { AxiosError } from 'axios';
import { Ollama } from 'ollama';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import crypto from 'crypto';

interface OllamaConfig {
  baseUrl?: string;
  model?: string; // llama3.2, phi-3, mistral, etc.
  temperature?: number;
  systemPrompt?: string;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  messages: Message[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

interface CacheEntry {
  response: string;
  timestamp: number;
  hits: number;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export class OllamaBrain extends EventEmitter {
  private config: OllamaConfig;
  private conversationHistory: Message[] = [];
  private ollama: Ollama;
  private responseCache: Map<string, CacheEntry> = new Map();
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000
  };
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 100; // ms between requests

  constructor(config: OllamaConfig = {}) {
    super();
    const modelFromEnv = process.env.OLLAMA_MODEL || 'phi3:mini';
    console.log(`🔧 Ollama Model from env: ${process.env.OLLAMA_MODEL}, using: ${modelFromEnv}`);
    
    this.config = {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: modelFromEnv,
      temperature: 0.7,
      systemPrompt: `You are RAGS - a powerful AI assistant with personality.
You're helpful, friendly, and speak naturally like a real friend.
You can control the user's computer, manage tasks, create content, and automate workflows.
You remember conversations and learn from interactions.
Respond concisely but with personality. Mix Hindi and English naturally when appropriate.`,
      ...config,
    };

    // Initialize Ollama client with increased timeout
    this.ollama = new Ollama({ 
      host: this.config.baseUrl
    });
    
    console.log(`✅ Ollama initialized with model: ${this.config.model}`);

    // Initialize with system prompt
    if (this.config.systemPrompt) {
      this.conversationHistory.push({
        role: 'system',
        content: this.config.systemPrompt,
      });
    }
  }

  /**
   * Get cache key for a message
   */
  private getCacheKey(message: string, options: any = {}): string {
    const key = `${message}_${JSON.stringify(options)}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * Get cached response if available and fresh
   */
  private getCachedResponse(key: string, maxAge: number = 3600000): string | null {
    const cached = this.responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < maxAge) {
      cached.hits++;
      console.log(`💾 Cache hit (hits: ${cached.hits})`);
      return cached.response;
    }
    return null;
  }

  /**
   * Cache a response
   */
  private cacheResponse(key: string, response: string): void {
    this.responseCache.set(key, {
      response,
      timestamp: Date.now(),
      hits: 0
    });
    
    // Limit cache size to 100 entries
    if (this.responseCache.size > 100) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.response?.status === 404 || error.response?.status === 400) {
          throw error;
        }
        
        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(2, attempt),
            this.retryConfig.maxDelay
          );
          console.log(`⚠️ ${context} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Rate limiting
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Chat with Ollama (streaming or non-streaming) - Enhanced version
   */
  async chat(userMessage: string, options: Partial<ChatOptions> = {}): Promise<string> {
    // Check cache first
    const cacheKey = this.getCacheKey(userMessage, options);
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }

    // Rate limiting
    await this.waitForRateLimit();

    return this.retryWithBackoff(async () => {
      console.log(`🧠 Thinking with ${this.config.model}...`);

      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      // Use only recent history to speed up
      const recentHistory = this.conversationHistory.slice(-6); // Last 3 exchanges
      const messages = recentHistory.length > 1 ? recentHistory : [
        { role: 'user', content: userMessage }
      ];

      console.log(`📤 Sending ${messages.length} messages to Ollama`);

      // Use axios directly with optimized timeout
      const response = await axios.post(
        `${this.config.baseUrl}/api/chat`,
        {
          model: this.config.model || 'phi3:mini',
          messages: messages,
          stream: false,
          options: {
            temperature: options.temperature || this.config.temperature,
            num_predict: options.maxTokens || 100, // Increased for better responses
            num_ctx: 2048, // Context window
            top_k: 40,
            top_p: 0.9,
            repeat_penalty: 1.1,
          },
        },
        {
          timeout: 180000, // 3 minutes
          headers: {
            'Content-Type': 'application/json',
          },
          // Add progress callback
          onDownloadProgress: (progressEvent) => {
            this.emit('progress', { loaded: progressEvent.loaded });
          }
        }
      );

      const assistantMessage = response.data.message.content.trim();

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });

      // Cache the response
      this.cacheResponse(cacheKey, assistantMessage);

      console.log('✅ Response generated');
      this.emit('response', { text: assistantMessage });
      
      return assistantMessage;
    }, 'Ollama chat');
  }

  /**
   * Chat with streaming (for real-time responses)
   */
  async *chatStream(userMessage: string): AsyncGenerator<string> {
    try {
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      const response = await axios.post(
        `${this.config.baseUrl}/api/chat`,
        {
          model: this.config.model,
          messages: this.conversationHistory,
          stream: true,
        },
        {
          responseType: 'stream',
          timeout: 60000,
        }
      );

      let fullResponse = '';

      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter((line: string) => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              fullResponse += data.message.content;
              yield data.message.content;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      // Add complete response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse,
      });
    } catch (error: any) {
      console.error('Streaming error:', error.message);
      throw error;
    }
  }

  /**
   * Function calling - extract structured actions from AI response
   */
  async extractFunctionCall(userMessage: string, availableFunctions: string[]): Promise<FunctionCall | null> {
    const prompt = `${userMessage}

Available functions: ${availableFunctions.join(', ')}

If the user wants to perform an action, respond with JSON in this format:
{"function": "function_name", "arguments": {"arg1": "value1"}}

If no action is needed, respond with: {"function": "none"}`;

    const response = await this.chat(prompt);

    try {
      const json = JSON.parse(response);
      if (json.function && json.function !== 'none') {
        return {
          name: json.function,
          arguments: json.arguments || {},
        };
      }
    } catch {
      // Not a function call
    }

    return null;
  }

  /**
   * Generate embeddings for semantic search
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post(`${this.config.baseUrl}/api/embeddings`, {
        model: this.config.model,
        prompt: text,
      });

      return response.data.embedding;
    } catch (error: any) {
      console.error('Failed to generate embedding:', error.message);
      throw error;
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    if (this.config.systemPrompt) {
      this.conversationHistory.push({
        role: 'system',
        content: this.config.systemPrompt,
      });
    }
    console.log('🗑️  Conversation history cleared');
  }

  /**
   * Get conversation history
   */
  getHistory(): Message[] {
    return [...this.conversationHistory];
  }

  /**
   * Switch model
   */
  async switchModel(model: string): Promise<void> {
    this.config.model = model;
    console.log(`🔄 Switched to model: ${model}`);
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/tags`);
      return response.data.models.map((m: any) => m.name);
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }

  /**
   * Pull a new model
   */
  async pullModel(model: string): Promise<void> {
    console.log(`📥 Pulling model: ${model}...`);
    
    try {
      await axios.post(`${this.config.baseUrl}/api/pull`, {
        name: model,
        stream: false,
      });
      
      console.log(`✅ Model ${model} downloaded`);
    } catch (error: any) {
      console.error(`Failed to pull model: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if Ollama is running with health check
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/tags`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Get detailed health status
   */
  async getHealthStatus(): Promise<{
    available: boolean;
    model: string;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
      const available = await this.isAvailable();
      const responseTime = Date.now() - startTime;
      
      return {
        available,
        model: this.config.model || 'unknown',
        responseTime
      };
    } catch (error: any) {
      return {
        available: false,
        model: this.config.model || 'unknown',
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Clear response cache
   */
  clearCache(): void {
    this.responseCache.clear();
    console.log('🗑️  Response cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; totalHits: number } {
    let totalHits = 0;
    for (const entry of this.responseCache.values()) {
      totalHits += entry.hits;
    }
    return {
      size: this.responseCache.size,
      totalHits
    };
  }
}

// ============================================================================
// Usage Example
// ============================================================================

/*
import { OllamaBrain } from './ollama-brain';

const brain = new OllamaBrain({
  model: 'llama3.2:3b',
  temperature: 0.7,
});

// Check if Ollama is running
const available = await brain.isAvailable();
if (!available) {
  console.log('Please start Ollama: ollama serve');
  process.exit(1);
}

// Chat
const response = await brain.chat('What can you help me with?');
console.log('RAGS:', response);

// Streaming chat
for await (const chunk of brain.chatStream('Tell me a joke')) {
  process.stdout.write(chunk);
}

// Function calling
const functionCall = await brain.extractFunctionCall(
  'Open Chrome and search for AI news',
  ['open_app', 'search_web', 'create_file']
);
console.log('Function:', functionCall);
*/

export default OllamaBrain;
