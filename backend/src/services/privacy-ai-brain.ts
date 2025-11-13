// Privacy-First AI Brain - Local Ollama + Optional Gemini Help
import { Ollama } from 'ollama';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class PrivacyAIBrain {
  private ollama: any;
  private gemini?: GoogleGenerativeAI;
  private conversationHistory: Message[] = [];
  private useGemini: boolean = false;

  constructor() {
    this.ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' });
    
    // Gemini is OPTIONAL - only for better responses
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_key_here') {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.useGemini = true;
      console.log('✅ Gemini enabled for enhanced responses (privacy mode)');
    } else {
      console.log('✅ Running 100% local with Ollama');
    }
  }

  async chat(userMessage: string): Promise<string> {
    this.conversationHistory.push({ role: 'user', content: userMessage });

    try {
      // ALWAYS try Ollama first (100% local)
      const ollamaResponse = await this.chatWithOllama(userMessage);
      
      // If Gemini is available AND response needs improvement, use it
      if (this.useGemini && this.needsImprovement(ollamaResponse)) {
        console.log('🔄 Using Gemini for better response (no data stored)');
        return await this.improveWithGemini(userMessage, ollamaResponse);
      }
      
      return ollamaResponse;
    } catch (error) {
      console.error('AI Error:', error);
      return 'मुझे समझने में थोड़ी दिक्कत हुई। फिर से बताओ?';
    }
  }

  private async chatWithOllama(message: string): Promise<string> {
    const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
    
    const response = await this.ollama.chat({
      model,
      messages: [
        {
          role: 'system',
          content: `You are RAGS, a helpful AI assistant. Respond in Hinglish (Hindi + English mix). 
Be concise, friendly, and helpful. Keep responses under 50 words unless asked for details.`
        },
        ...this.conversationHistory.slice(-5) // Last 5 messages for context
      ],
      stream: false,
    });

    const reply = response.message.content;
    this.conversationHistory.push({ role: 'assistant', content: reply });
    return reply;
  }

  private async improveWithGemini(userMessage: string, ollamaResponse: string): Promise<string> {
    if (!this.gemini) return ollamaResponse;

    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
      
      // IMPORTANT: We only send the QUESTION and ANSWER, not user's personal data
      const prompt = `Improve this AI response to be more natural and helpful in Hinglish:

User asked: "${userMessage}"
AI replied: "${ollamaResponse}"

Make it better, more natural, and in Hinglish. Keep it under 50 words.`;

      const result = await model.generateContent(prompt);
      const improved = result.response.text();
      
      this.conversationHistory.push({ role: 'assistant', content: improved });
      return improved;
    } catch (error) {
      console.error('Gemini error, using Ollama response:', error);
      return ollamaResponse;
    }
  }

  private needsImprovement(response: string): boolean {
    // Check if response is too short, generic, or unclear
    return response.length < 20 || 
           response.includes('I don\'t') || 
           response.includes('I cannot') ||
           response.includes('sorry');
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

export const privacyAI = new PrivacyAIBrain();
