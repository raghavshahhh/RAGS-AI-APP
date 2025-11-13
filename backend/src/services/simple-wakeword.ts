// ============================================================================
// SIMPLE WAKE WORD - Browser-based "Hey RAGS" detection
// ============================================================================

import { EventEmitter } from 'events';

interface WakeWordConfig {
  keywords?: string[];
  sensitivity?: number;
}

/**
 * Simple Wake Word Detection
 * Detects "Hey RAGS" and similar wake words from transcribed text
 */
export class SimpleWakeWord extends EventEmitter {
  private keywords: string[];
  private enabled: boolean = false;
  private lastDetection: Date | null = null;
  private cooldownMs: number = 3000; // 3 seconds cooldown

  constructor(config: WakeWordConfig = {}) {
    super();
    this.keywords = config.keywords || [
      'hey rags',
      'hai rags',
      'hello rags',
      'hi rags',
      'okay rags',
      'ok rags'
    ];
  }

  /**
   * Check if text contains wake word
   */
  detect(text: string): boolean {
    if (!this.enabled) return false;

    const lowerText = text.toLowerCase().trim();
    
    // Check cooldown
    if (this.lastDetection) {
      const timeSince = Date.now() - this.lastDetection.getTime();
      if (timeSince < this.cooldownMs) {
        return false;
      }
    }

    // Check for wake word
    for (const keyword of this.keywords) {
      if (lowerText.includes(keyword)) {
        this.lastDetection = new Date();
        console.log('🔥 Wake word detected:', keyword);
        
        this.emit('wakeword', {
          keyword,
          timestamp: new Date(),
          text: lowerText
        });
        
        return true;
      }
    }

    return false;
  }

  /**
   * Enable wake word detection
   */
  enable(): void {
    this.enabled = true;
    console.log('✅ Wake word detection enabled - Say "Hey RAGS"');
    this.emit('enabled');
  }

  /**
   * Disable wake word detection
   */
  disable(): void {
    this.enabled = false;
    console.log('❌ Wake word detection disabled');
    this.emit('disabled');
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Add custom keyword
   */
  addKeyword(keyword: string): void {
    this.keywords.push(keyword.toLowerCase());
    console.log(`➕ Added wake word: ${keyword}`);
  }

  /**
   * Set cooldown period (milliseconds)
   */
  setCooldown(ms: number): void {
    this.cooldownMs = ms;
  }
}

export const simpleWakeWord = new SimpleWakeWord();
