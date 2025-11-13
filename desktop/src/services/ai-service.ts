class AIService {
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private config: any = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    const configStr = localStorage.getItem('ragsConfig');
    if (configStr) {
      this.config = JSON.parse(configStr);
    }
  }

  async chat(userMessage: string): Promise<string> {
    this.loadConfig();
    this.conversationHistory.push({ role: 'user', content: userMessage });

    try {
      if (this.config?.model === 'gemini' && this.config?.geminiKey) {
        return await this.chatWithGemini(userMessage);
      } else if (this.config?.model === 'openai' && this.config?.openaiKey) {
        return await this.chatWithOpenAI(userMessage);
      } else {
        return await this.chatWithLocal(userMessage);
      }
    } catch (error) {
      console.error('AI Error:', error);
      return await this.chatWithLocal(userMessage);
    }
  }

  private async chatWithGemini(message: string): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.config.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `You are RAGS AI, a helpful Hindi-English speaking assistant. Respond in Hinglish (mix of Hindi and English) with proper Devanagari script. User said: ${message}` }]
          }]
        })
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'मुझे समझ नहीं आया।';
    this.conversationHistory.push({ role: 'assistant', content: reply });
    return reply;
  }

  private async chatWithOpenAI(message: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are RAGS AI, a helpful Hindi-English speaking assistant. Respond in Hinglish with proper Devanagari script.' },
          ...this.conversationHistory
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'मुझे समझ नहीं आया।';
    this.conversationHistory.push({ role: 'assistant', content: reply });
    return reply;
  }

  private async chatWithLocal(message: string): Promise<string> {
    // Try backend API first (no Ollama dependency)
    try {
      const response = await fetch('http://localhost:3000/api/v1/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.response) {
          return data.response;
        }
      }
    } catch (error) {}

    return this.getFallbackResponse(message);
  }
  
  private getFallbackResponse(message: string): string {
    const input = message.toLowerCase();
    
    // Greetings
    if (input.includes('hello') || input.includes('hi') || input.includes('hey') || input.includes('namaste') || input.includes('नमस्ते')) {
      return 'नमस्ते! मैं रैग्स हूँ। कैसे मदद कर सकता हूँ?';
    }
    
    // Time
    if (input.includes('time') || input.includes('समय') || input.includes('टाइम')) {
      const time = new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });
      return `अभी ${time} बज रहे हैं`;
    }
    
    // Date
    if (input.includes('date') || input.includes('तारीख') || input.includes('day')) {
      const date = new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long' });
      return `आज ${date} है`;
    }
    
    // Math
    if (input.match(/\d+\s*[+\-*/x×÷]\s*\d+/)) {
      try {
        const expr = input.replace(/[^0-9+\-*/().\s]/g, '');
        const result = eval(expr);
        return `जवाब है ${result}`;
      } catch {
        return 'मैथ में एरर आया, फिर से ट्राई करें';
      }
    }
    
    // Coding
    if (input.includes('code') || input.includes('program') || input.includes('function') || input.includes('coding')) {
      return 'मैं कोडिंग में हेल्प कर सकता हूँ। पाइथन, जावास्क्रिप्ट, जावा, कौनसी लैंग्वेज चाहिए?';
    }
    
    if (input.includes('python')) {
      return 'पाइथन बहुत पॉपुलर है। डेटा साइंस, वेब डेवलपमेंट, ऑटोमेशन सब कर सकते हैं। स्पेसिफिक क्वेश्चन पूछें';
    }
    
    if (input.includes('javascript') || input.includes('js')) {
      return 'जावास्क्रिप्ट वेब का किंग है। रिएक्ट, नोड जे एस, फ्रंटएंड बैकएंड सब में यूज होता है। क्या हेल्प चाहिए?';
    }
    
    // System commands
    if (input.includes('open') || input.includes('खोल') || input.includes('launch')) {
      if (input.includes('chrome') || input.includes('browser')) {
        return 'क्रोम ब्राउज़र ओपन करने के लिए सिस्टम इंटीग्रेशन चाहिए। अभी डेवलपमेंट मोड में है';
      }
      return 'कौनसा ऐप ओपन करना है? बताइए';
    }
    
    // Help
    if (input.includes('help') || input.includes('मदद') || input.includes('what can you do')) {
      return 'मैं ये कर सकता हूँ। टाइम और डेट बताना, मैथ कैलकुलेशन, कोडिंग हेल्प, जनरल क्वेश्चन। क्या चाहिए?';
    }
    
    // Thanks
    if (input.includes('thank') || input.includes('धन्यवाद') || input.includes('thanks')) {
      return 'आपका स्वागत है! कुछ और चाहिए तो बताइए';
    }
    
    // Bye
    if (input.includes('bye') || input.includes('goodbye') || input.includes('अलविदा')) {
      return 'अलविदा! फिर मिलेंगे';
    }
    
    // Weather
    if (input.includes('weather') || input.includes('मौसम')) {
      return 'वेदर की जानकारी के लिए इंटरनेट कनेक्शन चाहिए। अभी ऑफलाइन मोड में हूँ';
    }
    
    // Default
    return `मैं समझ गया। अभी मैं बेसिक मोड में हूँ। टाइम, डेट, मैथ, कोडिंग इन चीजों में हेल्प कर सकता हूँ। क्या पूछना है?`;
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

export const aiService = new AIService();
