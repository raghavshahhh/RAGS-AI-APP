// ============================================================================
// SIMPLE PERSONALITY ENGINE - Context-aware, Emotional AI Personality
// ============================================================================

interface PersonalityTraits {
  friendliness: number;      // 1-10
  humor: number;             // 1-10  
  enthusiasm: number;        // 1-10
  professionalism: number;   // 1-10
  helpfulness: number;       // 1-10
}

interface EmotionalState {
  current: 'happy' | 'neutral' | 'excited' | 'calm' | 'thinking' | 'curious';
  intensity: number; // 1-10
}

export class SimplePersonality {
  private traits: PersonalityTraits;
  private emotionalState: EmotionalState;
  private interactionCount: number = 0;

  constructor() {
    // Default RAGS personality - friendly, helpful, slightly humorous
    this.traits = {
      friendliness: 9,
      humor: 7,
      enthusiasm: 8,
      professionalism: 6,
      helpfulness: 10
    };

    this.emotionalState = {
      current: 'neutral',
      intensity: 5
    };
  }

  /**
   * Enhance response with personality
   */
  enhanceResponse(text: string, context?: {
    userEmotion?: string;
    taskType?: string;
    isFirstInteraction?: boolean;
  }): string {
    this.interactionCount++;

    // Detect emotion from text
    const detectedEmotion = this.detectEmotion(text);
    this.emotionalState.current = detectedEmotion;

    // Add personality touches based on traits
    let enhanced = text;

    // Add friendliness
    if (this.traits.friendliness > 7 && context?.isFirstInteraction) {
      enhanced = this.addFriendlyGreeting(enhanced);
    }

    // Add enthusiasm markers
    if (this.traits.enthusiasm > 7 && detectedEmotion === 'excited') {
      enhanced = this.addEnthusiasm(enhanced);
    }

    // Add helpful suggestions
    if (this.traits.helpfulness > 8) {
      enhanced = this.addHelpfulness(enhanced, context?.taskType);
    }

    return enhanced;
  }

  /**
   * Detect emotion from text
   */
  private detectEmotion(text: string): EmotionalState['current'] {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('!') || lowerText.includes('great') || lowerText.includes('awesome')) {
      return 'excited';
    }
    if (lowerText.includes('?') || lowerText.includes('search') || lowerText.includes('find')) {
      return 'curious';
    }
    if (lowerText.includes('okay') || lowerText.includes('sure') || lowerText.includes('theek')) {
      return 'calm';
    }
    if (lowerText.includes('searching') || lowerText.includes('looking') || lowerText.includes('dekh')) {
      return 'thinking';
    }
    if (lowerText.includes('happy') || lowerText.includes('good') || lowerText.includes('nice')) {
      return 'happy';
    }

    return 'neutral';
  }

  /**
   * Add friendly greeting
   */
  private addFriendlyGreeting(text: string): string {
    const greetings = [
      'Hey! ',
      'Namaste! ',
      'Hi there! ',
      'Hello! '
    ];
    
    const rand = Math.floor(Math.random() * greetings.length);
    return greetings[rand] + text;
  }

  /**
   * Add enthusiasm
   */
  private addEnthusiasm(text: string): string {
    if (!text.endsWith('!') && Math.random() > 0.5) {
      return text.replace(/\.$/, '!');
    }
    return text;
  }

  /**
   * Add helpful suggestions
   */
  private addHelpfulness(text: string, taskType?: string): string {
    // Safety check
    if (!text || typeof text !== 'string') return text || '';
    
    // Don't always add suggestions
    if (Math.random() > 0.3) return text;

    const suggestions: Record<string, string[]> = {
      search: [
        ' Kuch aur search karna hai?',
        ' Want me to search something else?',
        ' Need more information?'
      ],
      automation: [
        ' I can help with more tasks!',
        ' Kuch aur kaam hai?',
        ' Any other commands?'
      ],
      default: [
        ' How else can I help?',
        ' Kuch aur chahiye?',
        ' Anything else?'
      ]
    };

    // Safe fallback - use default if taskType not in suggestions
    const list = suggestions[taskType || 'default'] || suggestions['default'];
    const rand = Math.floor(Math.random() * list.length);
    
    return text + list[rand];
  }

  /**
   * Get current emotional state
   */
  getEmotionalState(): EmotionalState {
    return { ...this.emotionalState };
  }

  /**
   * Update personality trait
   */
  updateTrait(trait: keyof PersonalityTraits, value: number): void {
    if (value < 1 || value > 10) {
      throw new Error('Trait value must be between 1 and 10');
    }
    this.traits[trait] = value;
    console.log(`🎭 Updated ${trait} to ${value}`);
  }

  /**
   * Get personality summary
   */
  getSummary(): string {
    return `RAGS Personality:
- Friendliness: ${this.traits.friendliness}/10
- Humor: ${this.traits.humor}/10
- Enthusiasm: ${this.traits.enthusiasm}/10
- Professionalism: ${this.traits.professionalism}/10
- Helpfulness: ${this.traits.helpfulness}/10
Current Emotion: ${this.emotionalState.current} (${this.emotionalState.intensity}/10)
Interactions: ${this.interactionCount}`;
  }

  /**
   * Set emotion manually
   */
  setEmotion(emotion: EmotionalState['current'], intensity: number = 5): void {
    this.emotionalState = { current: emotion, intensity };
    console.log(`🎭 Emotion set to: ${emotion} (${intensity}/10)`);
  }

  /**
   * Get recommended TTS emotion
   */
  getRecommendedTTSEmotion(): 'neutral' | 'happy' | 'excited' | 'calm' {
    switch (this.emotionalState.current) {
      case 'excited':
        return 'excited';
      case 'happy':
        return 'happy';
      case 'calm':
      case 'thinking':
        return 'calm';
      default:
        return 'neutral';
    }
  }
}

export const simplePersonality = new SimplePersonality();
