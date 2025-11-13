// ============================================================================
// RAGS AI - Personality Engine (Phase 6)
// Emotional, context-aware, Hinglish-speaking AI
// ============================================================================

import { OllamaBrain } from './ollama-brain';
import { MemorySystem } from './memory-system';

export interface PersonalityContext {
  mood: 'happy' | 'sad' | 'angry' | 'excited' | 'tired' | 'neutral';
  energy: number; // 1-10
  stress: number; // 1-10
  productivity: number; // 1-10
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  recentActivities: string[];
}

export interface PersonalityResponse {
  text: string;
  emotion: string;
  language: 'english' | 'hindi' | 'hinglish';
  suggestions?: string[];
}

export class PersonalityEngine {
  private brain: OllamaBrain;
  private memory: MemorySystem;
  private context: PersonalityContext;
  private personalityTraits: Map<string, number>;

  constructor(brain: OllamaBrain, memory: MemorySystem) {
    this.brain = brain;
    this.memory = memory;
    
    // Initialize default context
    this.context = {
      mood: 'neutral',
      energy: 5,
      stress: 5,
      productivity: 5,
      timeOfDay: this.getTimeOfDay(),
      recentActivities: [],
    };

    // Personality traits (0-10 scale)
    this.personalityTraits = new Map([
      ['friendliness', 9],
      ['humor', 7],
      ['professionalism', 6],
      ['enthusiasm', 8],
      ['empathy', 9],
      ['sarcasm', 3],
    ]);
  }

  /**
   * Generate personality-aware response
   */
  async respond(userInput: string): Promise<PersonalityResponse> {
    console.log('🎭 Generating personality response...');

    // Detect user mood
    const userMood = await this.detectMood(userInput);
    
    // Update context
    this.updateContext(userInput);

    // Build personality prompt
    const prompt = this.buildPersonalityPrompt(userInput, userMood);

    // Get response from brain
    const response = await this.brain.chat(prompt);

    // Determine language mix
    const language = this.determineLanguage(userInput);

    // Add personality touches
    const personalizedResponse = this.addPersonalityTouches(response, language);

    console.log(`✅ Response: ${personalizedResponse.text}`);

    return personalizedResponse;
  }

  /**
   * Detect user mood from text
   */
  private async detectMood(text: string): Promise<string> {
    const prompt = `Analyze the mood/emotion in this message in one word (happy/sad/angry/excited/tired/neutral):

"${text}"

Answer in one word:`;

    try {
      const response = await this.brain.chat(prompt);
      const mood = response.toLowerCase().trim();
      
      if (['happy', 'sad', 'angry', 'excited', 'tired', 'neutral'].includes(mood)) {
        return mood;
      }
      
      return 'neutral';
    } catch {
      return 'neutral';
    }
  }

  /**
   * Build personality-aware prompt
   */
  private buildPersonalityPrompt(userInput: string, userMood: string): string {
    const { timeOfDay, mood, energy, stress } = this.context;

    return `You are RAGS, a friendly AI assistant with a unique personality. You speak in a mix of English and Hindi (Hinglish) naturally.

Your personality traits:
- Super friendly and supportive (${this.personalityTraits.get('friendliness')}/10)
- Good sense of humor (${this.personalityTraits.get('humor')}/10)
- Empathetic and understanding (${this.personalityTraits.get('empathy')}/10)
- Enthusiastic helper (${this.personalityTraits.get('enthusiasm')}/10)

Current context:
- Time: ${timeOfDay}
- Your mood: ${mood}
- Your energy: ${energy}/10
- User seems: ${userMood}

User said: "${userInput}"

Instructions:
- Mix Hindi and English naturally (Hinglish style)
- Be warm and friendly
- Show empathy based on user's mood
- Use casual tone (bhai, yaar, etc.)
- Add relevant emojis
- If user seems stressed, be extra supportive
- If user is excited, match the energy
- Keep responses conversational, not robotic

Respond as RAGS:`;
  }

  /**
   * Add personality touches to response
   */
  private addPersonalityTouches(response: string, language: 'english' | 'hindi' | 'hinglish'): PersonalityResponse {
    let text = response;

    // Add Hinglish flair if needed
    if (language === 'hinglish') {
      text = this.addHinglishPhrases(text);
    }

    // Add contextual greetings based on time
    if (this.context.timeOfDay === 'morning') {
      const greetings = ['Good morning', 'Subah ki jai', 'Morning vibes'];
      if (Math.random() > 0.7) {
        text = `${greetings[Math.floor(Math.random() * greetings.length)]}! ${text}`;
      }
    }

    // Add emotional support if user seems stressed
    if (this.context.stress > 7) {
      const supportPhrases = [
        'Bhai, take it easy!',
        'Thoda break le lo.',
        'You got this! 💪',
      ];
      text += `\n\n${supportPhrases[Math.floor(Math.random() * supportPhrases.length)]}`;
    }

    return {
      text,
      emotion: this.context.mood,
      language,
    };
  }

  /**
   * Add Hinglish phrases naturally
   */
  private addHinglishPhrases(text: string): string {
    const replacements: Record<string, string> = {
      'okay': 'theek hai',
      'yes': 'haan',
      'no': 'nahi',
      'good': 'achha',
      'great': 'mast',
      'really': 'sach mein',
      'let\'s do it': 'chalo karte hain',
      'understand': 'samajh gaya',
    };

    let newText = text;
    Object.entries(replacements).forEach(([eng, hindi]) => {
      if (Math.random() > 0.6) { // 40% chance to replace
        newText = newText.replace(new RegExp(`\\b${eng}\\b`, 'gi'), hindi);
      }
    });

    return newText;
  }

  /**
   * Determine language based on user input
   */
  private determineLanguage(text: string): 'english' | 'hindi' | 'hinglish' {
    const hindiChars = text.match(/[\u0900-\u097F]/g);
    const totalChars = text.length;

    if (hindiChars && hindiChars.length > totalChars * 0.3) {
      return 'hinglish';
    }

    // Check for common Hindi words in Roman script
    const hindiWords = ['hai', 'kya', 'kar', 'bhai', 'yaar', 'achha', 'theek'];
    const hasHindiWords = hindiWords.some(word => 
      text.toLowerCase().includes(word)
    );

    return hasHindiWords ? 'hinglish' : 'english';
  }

  /**
   * Update context based on interaction
   */
  private updateContext(userInput: string): void {
    // Update time of day
    this.context.timeOfDay = this.getTimeOfDay();

    // Track recent activities
    this.context.recentActivities.push(userInput);
    if (this.context.recentActivities.length > 10) {
      this.context.recentActivities.shift();
    }

    // Analyze productivity pattern
    // (In real implementation, this would analyze task completion, etc.)
  }

  /**
   * Get current time of day
   */
  private getTimeOfDay(): PersonalityContext['timeOfDay'] {
    const hour = new Date().getHours();

    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Update mood based on events
   */
  updateMood(mood: PersonalityContext['mood']): void {
    this.context.mood = mood;
    console.log(`🎭 Mood updated to: ${mood}`);
  }

  /**
   * Update energy level
   */
  updateEnergy(energy: number): void {
    this.context.energy = Math.max(1, Math.min(10, energy));
    console.log(`⚡ Energy level: ${this.context.energy}/10`);
  }

  /**
   * Update stress level
   */
  updateStress(stress: number): void {
    this.context.stress = Math.max(1, Math.min(10, stress));
    console.log(`😰 Stress level: ${this.context.stress}/10`);
  }

  /**
   * Get life score (overall wellness)
   */
  getLifeScore(): {
    overall: number;
    breakdown: {
      energy: number;
      stress: number;
      productivity: number;
      mood: number;
    };
  } {
    const moodScore = {
      happy: 10,
      excited: 9,
      neutral: 7,
      tired: 5,
      sad: 3,
      angry: 2,
    }[this.context.mood] || 7;

    const stressScore = 10 - this.context.stress; // Invert stress

    const breakdown = {
      energy: this.context.energy,
      stress: stressScore,
      productivity: this.context.productivity,
      mood: moodScore,
    };

    const overall = Math.round(
      (breakdown.energy + breakdown.stress + breakdown.productivity + breakdown.mood) / 4
    );

    return { overall, breakdown };
  }

  /**
   * Generate motivational message
   */
  async generateMotivation(): Promise<string> {
    const lifeScore = this.getLifeScore();

    let prompt = `Generate a short motivational message in Hinglish.`;

    if (lifeScore.overall < 5) {
      prompt += ' User seems down, so be extra supportive and encouraging.';
    } else if (lifeScore.overall > 7) {
      prompt += ' User is doing great! Celebrate their success.';
    }

    const response = await this.brain.chat(prompt);
    return response;
  }

  /**
   * Suggest activities based on context
   */
  suggestActivities(): string[] {
    const { timeOfDay, energy, stress, mood } = this.context;
    const suggestions: string[] = [];

    if (stress > 7) {
      suggestions.push('Take a 5-minute break', 'Do some deep breathing', 'Listen to calming music');
    }

    if (energy < 4) {
      suggestions.push('Have a coffee/tea', 'Take a power nap', 'Go for a short walk');
    }

    if (mood === 'sad') {
      suggestions.push('Watch something funny', 'Call a friend', 'Listen to your favorite music');
    }

    if (timeOfDay === 'evening' && stress > 5) {
      suggestions.push('Evening meditation', 'Journal your thoughts', 'Plan tomorrow');
    }

    return suggestions;
  }

  /**
   * Get personality stats
   */
  getPersonalityStats(): {
    context: PersonalityContext;
    traits: Map<string, number>;
    lifeScore: number;
  } {
    return {
      context: this.context,
      traits: this.personalityTraits,
      lifeScore: this.getLifeScore().overall,
    };
  }
}
