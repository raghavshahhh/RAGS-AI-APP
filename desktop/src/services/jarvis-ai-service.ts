class JarvisAIService {
  private config: any = null;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    const configStr = localStorage.getItem('ragsConfig');
    if (configStr) {
      this.config = JSON.parse(configStr);
    }
  }

  async chat(userMessage: string, imageData?: string): Promise<string> {
    this.loadConfig();

    // Try backend API first
    try {
      const response = await fetch('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.response;
      }
    } catch (error) {
      console.log('Backend unavailable, using fallback');
    }

    // Try Gemini Pro (best for intelligence)
    if (this.config?.geminiKey) {
      return await this.chatWithGemini(userMessage, imageData);
    }

    // Fallback to smart responses
    return this.getSmartResponse(userMessage);
  }

  private async chatWithGemini(message: string, imageData?: string): Promise<string> {
    try {
      const model = imageData ? 'gemini-pro-vision' : 'gemini-pro';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.geminiKey}`;

      const parts: any[] = [{
        text: `You are RAGS - a JARVIS-like AI assistant. 
Rules:
- Respond in Hinglish (Hindi+English mix) naturally
- Be helpful, intelligent, and conversational
- Keep responses concise but informative
- Use English for technical terms
- Show personality and emotions

User: ${message}`
      }];

      if (imageData) {
        parts.push({
          inline_data: {
            mime_type: 'image/jpeg',
            data: imageData.split(',')[1]
          }
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
          }
        })
      });

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not understand.';
      
      this.conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: reply }
      );

      return reply;
    } catch (error) {
      console.error('Gemini error:', error);
      return this.getSmartResponse(message);
    }
  }

  private getSmartResponse(message: string): string {
    const input = message.toLowerCase();

    // Greetings
    if (input.match(/\b(hello|hi|hey|namaste)\b/)) {
      return 'Hey! RAGS here. How can I help you?';
    }

    // Time
    if (input.match(/\b(time|kya time)\b/)) {
      const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return `It's ${time} right now.`;
    }

    // Date
    if (input.match(/\b(date|day|aaj)\b/)) {
      const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      return `Today is ${date}.`;
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

      return `The answer is ${result}.`;
    }

    // Search
    if (input.match(/\b(search|google|find|dhundho)\b/)) {
      const query = message.replace(/\b(search|google|find|dhundho|for|karo)\b/gi, '').trim();
      return `Searching for "${query}"... Opening browser.`;
    }

    // Coding
    if (input.match(/\b(code|coding|program|python|javascript)\b/)) {
      return 'I can help with coding! Python, JavaScript, Java - what do you need?';
    }

    // Help
    if (input.match(/\b(help|kya kar sakte|what can you do)\b/)) {
      return 'I can help with: time, date, math, coding, search, and general questions. Just ask!';
    }

    // Thanks
    if (input.match(/\b(thank|thanks|shukriya)\b/)) {
      return 'You\'re welcome! Anything else?';
    }

    // Default
    return `I understand. I'm in basic mode right now. Add Gemini API key for full intelligence!`;
  }

  async analyzeImage(imageData: string): Promise<string> {
    if (!this.config?.geminiKey) {
      return 'I need Gemini API key to analyze images. Add it in settings!';
    }

    return await this.chatWithGemini('What do you see in this image? Describe in Hinglish.', imageData);
  }

  async detectEmotion(text: string): Promise<'happy' | 'sad' | 'excited' | 'thinking' | 'curious' | 'neutral'> {
    const lower = text.toLowerCase();

    if (lower.match(/\b(great|awesome|amazing|love|perfect)\b/)) return 'excited';
    if (lower.match(/\b(sad|sorry|bad|problem|issue)\b/)) return 'sad';
    if (lower.match(/\b(what|how|why|explain|tell)\b/)) return 'curious';
    if (lower.match(/\b(think|calculate|analyze|search)\b/)) return 'thinking';
    if (lower.match(/\b(hello|hi|thanks|good)\b/)) return 'happy';

    return 'neutral';
  }
}

export const jarvisAI = new JarvisAIService();
