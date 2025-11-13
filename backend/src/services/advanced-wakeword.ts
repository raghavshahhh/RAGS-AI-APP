// ============================================================================
// ADVANCED WAKE WORD - Multiple wake words with sensitivity control
// ============================================================================

import { EventEmitter } from 'events';

interface WakeWordConfig {
  wakeWords: string[];
  sensitivity: number; // 0.0 to 1.0
  cooldownMs: number; // Prevent multiple triggers
}

export class AdvancedWakeWord extends EventEmitter {
  private config: WakeWordConfig;
  private lastTrigger: number = 0;
  private isActive: boolean = false;

  constructor(config?: Partial<WakeWordConfig>) {
    super();
    this.config = {
      wakeWords: ['hey rags', 'yo rags', 'rags bro', 'hey jarvis'],
      sensitivity: 0.7,
      cooldownMs: 2000,
      ...config
    };
  }

  /**
   * Start wake word detection
   */
  start(): void {
    this.isActive = true;
    console.log('🎤 Advanced wake word detection started');
    console.log(`   Wake words: ${this.config.wakeWords.join(', ')}`);
    console.log(`   Sensitivity: ${this.config.sensitivity}`);
    this.emit('ready');
  }

  /**
   * Process text and check for wake words
   */
  processText(text: string): boolean {
    if (!this.isActive) return false;

    const lowerText = text.toLowerCase().trim();
    
    // Check cooldown
    const now = Date.now();
    if (now - this.lastTrigger < this.config.cooldownMs) {
      return false;
    }

    // Check each wake word
    for (const wakeWord of this.config.wakeWords) {
      if (this.matchWakeWord(lowerText, wakeWord)) {
        this.lastTrigger = now;
        
        // Remove wake word from text
        const cleanText = this.removeWakeWord(lowerText, wakeWord);
        
        console.log(`🔥 Wake word detected: "${wakeWord}"`);
        this.emit('wakeword', {
          wakeWord,
          originalText: text,
          cleanText,
          timestamp: new Date()
        });
        
        return true;
      }
    }

    return false;
  }

  /**
   * Match wake word with fuzzy matching
   */
  private matchWakeWord(text: string, wakeWord: string): boolean {
    // Exact match
    if (text.includes(wakeWord)) return true;

    // Fuzzy match based on sensitivity
    const words = text.split(' ');
    const wakeWords = wakeWord.split(' ');
    
    // Check if wake word appears at start
    if (words.length >= wakeWords.length) {
      const startWords = words.slice(0, wakeWords.length).join(' ');
      const similarity = this.calculateSimilarity(startWords, wakeWord);
      
      if (similarity >= this.config.sensitivity) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate text similarity (0.0 to 1.0)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const len1 = text1.length;
    const len2 = text2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1.0;
    
    let matches = 0;
    for (let i = 0; i < Math.min(len1, len2); i++) {
      if (text1[i] === text2[i]) matches++;
    }
    
    return matches / maxLen;
  }

  /**
   * Remove wake word from text
   */
  private removeWakeWord(text: string, wakeWord: string): string {
    return text.replace(wakeWord, '').trim();
  }

  /**
   * Add custom wake word
   */
  addWakeWord(wakeWord: string): void {
    if (!this.config.wakeWords.includes(wakeWord.toLowerCase())) {
      this.config.wakeWords.push(wakeWord.toLowerCase());
      console.log(`✅ Added wake word: "${wakeWord}"`);
    }
  }

  /**
   * Remove wake word
   */
  removeWakeWord(wakeWord: string): void {
    const index = this.config.wakeWords.indexOf(wakeWord.toLowerCase());
    if (index > -1) {
      this.config.wakeWords.splice(index, 1);
      console.log(`❌ Removed wake word: "${wakeWord}"`);
    }
  }

  /**
   * Update sensitivity
   */
  setSensitivity(sensitivity: number): void {
    if (sensitivity < 0 || sensitivity > 1) {
      throw new Error('Sensitivity must be between 0.0 and 1.0');
    }
    this.config.sensitivity = sensitivity;
    console.log(`🎚️  Sensitivity updated to ${sensitivity}`);
  }

  /**
   * Get current wake words
   */
  getWakeWords(): string[] {
    return [...this.config.wakeWords];
  }

  /**
   * Stop detection
   */
  stop(): void {
    this.isActive = false;
    console.log('🛑 Wake word detection stopped');
    this.emit('stopped');
  }
}

export const advancedWakeWord = new AdvancedWakeWord();
