/**
 * 🎭 ENHANCED CONVERSATION ENGINE
 * ChatGPT-level smooth conversation with streaming, context, and natural flow
 */

import { EventEmitter } from 'events';
import { OllamaBrain } from './ollama-brain';
import { LocalMemory } from './local-memory';

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  emotion?: string;
  intent?: string;
  confidence?: number;
}

interface StreamingResponse {
  text: string;
  isComplete: boolean;
  emotion: string;
  confidence: number;
  shouldPause: boolean;
  fillerWord?: string;
}

interface ConversationContext {
  userId: string;
  messages: ConversationMessage[];
  currentMood: string;
  personalityMode: 'work' | 'chill' | 'teacher' | 'coach' | 'jarvis';
  lastInteraction: Date;
  userPreferences: {
    responseStyle: 'detailed' | 'concise' | 'casual';
    language: 'en' | 'hi' | 'hinglish';
    voiceSpeed: number;
  };
}

export class EnhancedConversationEngine extends EventEmitter {
  private ollamaBrain: OllamaBrain;
  private memory: LocalMemory;
  private contexts: Map<string, ConversationContext> = new Map();
  private isStreaming: boolean = false;
  
  // Natural filler words for smooth conversation
  private readonly FILLER_WORDS = {
    thinking: ['Let me think...', 'Hmm...', 'Give me a sec...', 'One moment...'],
    found: ['Got it!', 'Ah yes!', 'Found it!', 'Alright!'],
    transition: ['So...', 'Well...', 'Actually...', 'By the way...'],
    empathy: ['I understand...', 'That makes sense...', 'I see...'],
    excitement: ['Awesome!', 'That\'s great!', 'Nice!', 'Cool!'],
    concern: ['Oh no...', 'That\'s tough...', 'I\'m sorry to hear that...']
  };

  // Emotion detection patterns
  private readonly EMOTION_PATTERNS = {
    excited: /(!|awesome|amazing|great|yay|woohoo)/i,
    sad: /(sad|depressed|down|upset|cry)/i,
    angry: /(angry|mad|furious|annoyed|hate)/i,
    confused: /(confused|don't understand|what|huh)/i,
    happy: /(happy|joy|smile|laugh|good)/i,
    worried: /(worried|anxious|nervous|scared)/i
  };

  // Intent detection patterns
  private readonly INTENT_PATTERNS = {
    question: /(\?|what|how|when|where|why|who)/i,
    request: /(please|can you|could you|would you)/i,
    command: /(do|make|create|build|fix)/i,
    casual: /(hi|hello|hey|sup|what's up)/i,
    goodbye: /(bye|goodbye|see you|later)/i
  };

  constructor() {
    super();
    this.ollamaBrain = new OllamaBrain();
    this.memory = new LocalMemory();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Handle streaming responses
    this.on('streamChunk', (chunk: string, context: ConversationContext) => {
      this.processStreamChunk(chunk, context);
    });

    // Handle conversation completion
    this.on('conversationComplete', (context: ConversationContext) => {
      this.saveConversationToMemory(context);
    });
  }

  /**
   * Initialize conversation context for a user
   */
  async initializeContext(userId: string, personalityMode: 'work' | 'chill' | 'teacher' | 'coach' | 'jarvis' = 'jarvis'): Promise<void> {
    const context: ConversationContext = {
      userId,
      messages: [],
      currentMood: 'neutral',
      personalityMode,
      lastInteraction: new Date(),
      userPreferences: {
        responseStyle: 'casual',
        language: 'hinglish',
        voiceSpeed: 1.0
      }
    };

    // Load previous conversation history from memory
    try {
      const memories = await this.memory.recall(`user:${userId}`, 10);
      if (memories.length > 0) {
        // Convert memories to conversation messages
        context.messages = memories.slice(-10).map(memory => ({
          role: memory.metadata?.role || 'user',
          content: memory.content,
          timestamp: new Date(memory.created_at),
          emotion: memory.metadata?.emotion,
          confidence: memory.metadata?.confidence
        }));
      }
    } catch (error) {
      console.log('No previous conversation history found');
    }

    this.contexts.set(userId, context);
    
    // Add system prompt based on personality
    const systemPrompt = this.getSystemPrompt(personalityMode);
    context.messages.unshift({
      role: 'system',
      content: systemPrompt,
      timestamp: new Date()
    });

    console.log(`🎭 Conversation context initialized for ${userId} in ${personalityMode} mode`);
  }

  /**
   * Process user message with streaming response
   */
  async processMessage(userId: string, message: string): Promise<AsyncGenerator<StreamingResponse, void, unknown>> {
    const context = this.contexts.get(userId);
    if (!context) {
      throw new Error('Context not initialized. Call initializeContext first.');
    }

    // Detect emotion and intent from user message
    const emotion = this.detectEmotion(message);
    const intent = this.detectIntent(message);

    // Add user message to context
    const userMessage: ConversationMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
      emotion,
      intent
    };
    context.messages.push(userMessage);

    // Update user mood based on emotion
    if (emotion !== 'neutral') {
      context.currentMood = emotion;
    }

    console.log(`🎯 Detected emotion: ${emotion}, intent: ${intent}`);

    // Generate streaming response
    return this.generateStreamingResponse(context, message);
  }

  /**
   * Generate streaming response with natural flow
   */
  private async *generateStreamingResponse(context: ConversationContext, userMessage: string): AsyncGenerator<StreamingResponse, void, unknown> {
    this.isStreaming = true;

    try {
      // Start with thinking filler if complex query
      if (this.isComplexQuery(userMessage)) {
        const thinkingFiller = this.getRandomFiller('thinking');
        yield {
          text: thinkingFiller,
          isComplete: false,
          emotion: 'thinking',
          confidence: 1.0,
          shouldPause: true,
          fillerWord: thinkingFiller
        };
        
        // Small pause for natural feel
        await this.sleep(500);
      }

      // Prepare conversation history for Ollama
      const conversationHistory = this.prepareConversationHistory(context);
      
      // Get streaming response from Ollama (simulate streaming for now)
      const ollamaResponse = await this.ollamaBrain.chat(userMessage);
      const ollamaStream = this.simulateStreaming(ollamaResponse);

      let fullResponse = '';
      let wordBuffer = '';
      let sentenceBuffer = '';

      for await (const chunk of ollamaStream) {
        if (!this.isStreaming) break; // Allow interruption

        fullResponse += chunk;
        wordBuffer += chunk;

        // Send word-by-word or phrase-by-phrase
        if (wordBuffer.includes(' ') || wordBuffer.includes('.') || wordBuffer.includes(',')) {
          const words = wordBuffer.split(/(\s+|[.,!?])/);
          
          for (let i = 0; i < words.length - 1; i++) {
            const word = words[i];
            if (word.trim()) {
              sentenceBuffer += word;
              
              // Determine if we should pause
              const shouldPause = word.includes('.') || word.includes('!') || word.includes('?') || word.includes(',');
              
              yield {
                text: word,
                isComplete: false,
                emotion: this.detectResponseEmotion(sentenceBuffer, context.currentMood),
                confidence: 0.9,
                shouldPause,
                fillerWord: shouldPause ? this.getContextualFiller(context.currentMood) : undefined
              };

              // Natural pause between words
              await this.sleep(50);
            }
          }
          
          wordBuffer = words[words.length - 1] || '';
        }
      }

      // Send any remaining content
      if (wordBuffer.trim()) {
        yield {
          text: wordBuffer,
          isComplete: false,
          emotion: this.detectResponseEmotion(fullResponse, context.currentMood),
          confidence: 0.9,
          shouldPause: false
        };
      }

      // Add completion filler
      const completionFiller = this.getRandomFiller('found');
      yield {
        text: '',
        isComplete: true,
        emotion: 'satisfied',
        confidence: 1.0,
        shouldPause: true,
        fillerWord: completionFiller
      };

      // Save assistant response to context
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        emotion: this.detectResponseEmotion(fullResponse, context.currentMood),
        confidence: 0.9
      };
      context.messages.push(assistantMessage);

      // Update last interaction
      context.lastInteraction = new Date();

      // Save to memory
      await this.saveMessageToMemory(context.userId, userMessage, fullResponse);

      console.log(`✅ Streaming response completed for ${context.userId}`);

    } catch (error) {
      console.error('Streaming response error:', error);
      yield {
        text: 'Sorry, I encountered an error. Let me try again...',
        isComplete: true,
        emotion: 'apologetic',
        confidence: 0.5,
        shouldPause: true
      };
    } finally {
      this.isStreaming = false;
    }
  }

  /**
   * Stop current streaming response (for interruptions)
   */
  stopStreaming(): void {
    this.isStreaming = false;
    this.emit('streamingStopped');
    console.log('🛑 Streaming response interrupted');
  }

  /**
   * Detect emotion from user message
   */
  private detectEmotion(message: string): string {
    for (const [emotion, pattern] of Object.entries(this.EMOTION_PATTERNS)) {
      if (pattern.test(message)) {
        return emotion;
      }
    }
    return 'neutral';
  }

  /**
   * Detect intent from user message
   */
  private detectIntent(message: string): string {
    for (const [intent, pattern] of Object.entries(this.INTENT_PATTERNS)) {
      if (pattern.test(message)) {
        return intent;
      }
    }
    return 'statement';
  }

  /**
   * Detect emotion from AI response
   */
  private detectResponseEmotion(response: string, userMood: string): string {
    // Mirror user emotion or provide appropriate response
    if (userMood === 'excited') return 'enthusiastic';
    if (userMood === 'sad') return 'empathetic';
    if (userMood === 'angry') return 'calming';
    if (userMood === 'confused') return 'helpful';
    
    // Analyze response content
    if (/great|awesome|amazing|excellent/i.test(response)) return 'positive';
    if (/sorry|unfortunately|problem/i.test(response)) return 'apologetic';
    if (/interesting|curious|wonder/i.test(response)) return 'curious';
    
    return 'neutral';
  }

  /**
   * Check if query is complex and needs thinking time
   */
  private isComplexQuery(message: string): boolean {
    const complexPatterns = [
      /analyze|explain|compare|calculate|research/i,
      /how to|step by step|tutorial/i,
      /what's the difference|pros and cons/i,
      /plan|strategy|approach/i
    ];
    
    return complexPatterns.some(pattern => pattern.test(message)) || message.length > 100;
  }

  /**
   * Get random filler word based on context
   */
  private getRandomFiller(type: keyof typeof this.FILLER_WORDS): string {
    const fillers = this.FILLER_WORDS[type];
    return fillers[Math.floor(Math.random() * fillers.length)];
  }

  /**
   * Get contextual filler based on mood
   */
  private getContextualFiller(mood: string): string {
    switch (mood) {
      case 'excited': return this.getRandomFiller('excitement');
      case 'sad': return this.getRandomFiller('empathy');
      case 'confused': return this.getRandomFiller('empathy');
      default: return this.getRandomFiller('transition');
    }
  }

  /**
   * Get system prompt based on personality mode
   */
  private getSystemPrompt(personality: string): string {
    const prompts = {
      jarvis: "You are JARVIS, Tony Stark's AI assistant. Be intelligent, witty, and slightly sarcastic. Use technical terms when appropriate but explain complex concepts clearly. Respond in a mix of English and Hindi (Hinglish) as natural for Indian users.",
      
      chill: "You are a chill, friendly AI buddy. Use casual language, Gen Z slang, and be relaxed. Mix English and Hindi naturally. Be supportive and fun to talk to.",
      
      work: "You are a professional AI assistant. Be concise, accurate, and business-focused. Provide clear, actionable information. Use formal but friendly tone.",
      
      teacher: "You are a patient, knowledgeable teacher. Explain concepts step-by-step, ask clarifying questions, and encourage learning. Be supportive and detailed.",
      
      coach: "You are a motivational coach. Be encouraging, positive, and goal-oriented. Help users achieve their objectives with enthusiasm and practical advice."
    };
    
    return prompts[personality] || prompts.jarvis;
  }

  /**
   * Prepare conversation history for Ollama
   */
  private prepareConversationHistory(context: ConversationContext): ConversationMessage[] {
    // Keep last 10 messages for context (excluding system prompt)
    return context.messages.filter(msg => msg.role !== 'system').slice(-10);
  }

  /**
   * Save conversation to memory
   */
  private async saveMessageToMemory(userId: string, userMessage: string, assistantResponse: string): Promise<void> {
    try {
      // Save user message
      await this.memory.remember(userMessage, {
        role: 'user',
        userId,
        source: 'conversation'
      });

      // Save assistant response
      await this.memory.remember(assistantResponse, {
        role: 'assistant',
        userId,
        source: 'conversation'
      });
    } catch (error) {
      console.error('Failed to save conversation to memory:', error);
    }
  }

  /**
   * Save full conversation context to memory
   */
  private async saveConversationToMemory(context: ConversationContext): Promise<void> {
    try {
      await this.memory.remember(JSON.stringify({
        messages: context.messages.slice(-10),
        mood: context.currentMood,
        personality: context.personalityMode
      }), {
        type: 'conversation_session',
        userId: context.userId,
        messageCount: context.messages.length
      });
    } catch (error) {
      console.error('Failed to save conversation context:', error);
    }
  }

  /**
   * Get conversation context for user
   */
  getContext(userId: string): ConversationContext | undefined {
    return this.contexts.get(userId);
  }

  /**
   * Update user preferences
   */
  updatePreferences(userId: string, preferences: Partial<ConversationContext['userPreferences']>): void {
    const context = this.contexts.get(userId);
    if (context) {
      context.userPreferences = { ...context.userPreferences, ...preferences };
    }
  }

  /**
   * Switch personality mode
   */
  switchPersonality(userId: string, personality: ConversationContext['personalityMode']): void {
    const context = this.contexts.get(userId);
    if (context) {
      context.personalityMode = personality;
      // Update system prompt
      context.messages[0] = {
        role: 'system',
        content: this.getSystemPrompt(personality),
        timestamp: new Date()
      };
      console.log(`🎭 Switched to ${personality} mode for ${userId}`);
    }
  }

  /**
   * Simulate streaming from complete response
   */
  private async *simulateStreaming(response: string): AsyncGenerator<string, void, unknown> {
    const words = response.split(' ');
    for (const word of words) {
      yield word + ' ';
      await this.sleep(50); // 50ms delay between words
    }
  }

  /**
   * Utility function for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Process stream chunk with natural pauses
   */
  private processStreamChunk(chunk: string, context: ConversationContext): void {
    // Add natural processing delays based on content
    const processingTime = this.calculateProcessingTime(chunk);
    setTimeout(() => {
      this.emit('chunkProcessed', chunk, context);
    }, processingTime);
  }

  /**
   * Calculate natural processing time for content
   */
  private calculateProcessingTime(content: string): number {
    // Simulate human-like thinking time
    const baseTime = 50; // 50ms base
    const complexityMultiplier = content.length * 2; // 2ms per character
    const punctuationPause = (content.match(/[.!?]/g) || []).length * 100; // 100ms per sentence end
    
    return Math.min(baseTime + complexityMultiplier + punctuationPause, 500); // Max 500ms
  }
}

// Export singleton instance
export const enhancedConversationEngine = new EnhancedConversationEngine();

export default EnhancedConversationEngine;
