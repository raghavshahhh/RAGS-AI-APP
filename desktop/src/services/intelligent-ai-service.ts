import { aiService } from './ai-service';
import { browserService } from './browser-service';
import { personalityService } from './personality-service';

interface AIResponse {
  text: string;
  emotion: 'happy' | 'thinking' | 'excited' | 'curious' | 'neutral' | 'surprised';
  action?: {
    type: 'search' | 'map' | 'website' | 'weather';
    data: any;
  };
}

class IntelligentAIService {
  async processMessage(userMessage: string): Promise<AIResponse> {
    const lower = userMessage.toLowerCase();
    
    // Detect emotion from user message
    const emotion = personalityService.analyzeText(userMessage);
    personalityService.setEmotion(emotion);

    // Search action
    if (lower.match(/\b(search|google|find|dhundho|khojo)\b/)) {
      const query = userMessage.replace(/\b(search|google|find|dhundho|khojo|for|about|karo)\b/gi, '').trim();
      if (query) {
        const result = await browserService.search(query);
        return {
          text: result,
          emotion: 'thinking',
          action: { type: 'search', data: { query } }
        };
      }
    }

    // Map action
    if (lower.match(/\b(map|location|navigate|directions|rasta|jagah)\b/)) {
      const location = userMessage.replace(/\b(map|location|show|open|navigate|ka|dikha|khol)\b/gi, '').trim();
      if (location) {
        const result = browserService.openMap(location);
        return {
          text: result,
          emotion: 'excited',
          action: { type: 'map', data: { location } }
        };
      }
    }

    // Website action
    if (lower.match(/\b(open|website|khol|browse)\b/) && lower.match(/\.(com|org|net|in|io)/)) {
      const urlMatch = userMessage.match(/([a-z0-9-]+\.(com|org|net|in|io))/i);
      if (urlMatch) {
        const result = browserService.openWebsite(urlMatch[0]);
        return {
          text: result,
          emotion: 'happy',
          action: { type: 'website', data: { url: urlMatch[0] } }
        };
      }
    }

    // Weather action
    if (lower.match(/\b(weather|mausam|temperature)\b/)) {
      const city = userMessage.replace(/\b(weather|mausam|temperature|in|ka|of)\b/gi, '').trim() || 'Delhi';
      const result = await browserService.getWeather(city);
      return {
        text: result,
        emotion: 'curious',
        action: { type: 'weather', data: { city } }
      };
    }

    // Regular AI chat
    const response = await aiService.chat(userMessage);
    return {
      text: response,
      emotion: personalityService.analyzeText(response)
    };
  }
}

export const intelligentAI = new IntelligentAIService();
