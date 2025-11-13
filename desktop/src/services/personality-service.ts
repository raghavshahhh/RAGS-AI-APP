type Emotion = 'happy' | 'thinking' | 'excited' | 'curious' | 'neutral' | 'surprised';

interface PersonalityState {
  emotion: Emotion;
  blinkRate: number;
  expressiveness: number;
}

class PersonalityService {
  private currentEmotion: Emotion = 'neutral';
  private listeners: ((state: PersonalityState) => void)[] = [];

  analyzeText(text: string): Emotion {
    const lower = text.toLowerCase();
    
    if (lower.match(/\b(great|awesome|amazing|wonderful|excellent|perfect)\b/)) {
      return 'excited';
    }
    if (lower.match(/\b(what|how|why|when|where|explain|tell me)\b/)) {
      return 'curious';
    }
    if (lower.match(/\b(think|calculate|search|find|analyze)\b/)) {
      return 'thinking';
    }
    if (lower.match(/\b(wow|really|omg|amazing)\b/)) {
      return 'surprised';
    }
    if (lower.match(/\b(hello|hi|thanks|good|nice)\b/)) {
      return 'happy';
    }
    
    return 'neutral';
  }

  setEmotion(emotion: Emotion) {
    this.currentEmotion = emotion;
    this.notifyListeners();
  }

  getPersonalityState(): PersonalityState {
    const states: Record<Emotion, PersonalityState> = {
      happy: { emotion: 'happy', blinkRate: 0.5, expressiveness: 0.8 },
      thinking: { emotion: 'thinking', blinkRate: 0.3, expressiveness: 0.4 },
      excited: { emotion: 'excited', blinkRate: 0.7, expressiveness: 1.0 },
      curious: { emotion: 'curious', blinkRate: 0.4, expressiveness: 0.6 },
      neutral: { emotion: 'neutral', blinkRate: 0.5, expressiveness: 0.5 },
      surprised: { emotion: 'surprised', blinkRate: 0.8, expressiveness: 0.9 },
    };
    
    return states[this.currentEmotion];
  }

  onEmotionChange(callback: (state: PersonalityState) => void) {
    this.listeners.push(callback);
  }

  private notifyListeners() {
    const state = this.getPersonalityState();
    this.listeners.forEach(cb => cb(state));
  }
}

export const personalityService = new PersonalityService();
