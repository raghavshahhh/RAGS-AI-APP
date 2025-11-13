// ============================================================================
// SIMPLE TTS - macOS Native Text-to-Speech
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface TTSOptions {
  voice?: string; // 'Samantha', 'Alex', 'Karen', etc.
  rate?: number; // Words per minute (100-300)
  saveToFile?: string; // Optional: save audio to file
}

export class SimpleTTS {
  private defaultVoice: string;
  private defaultRate: number;
  private audioDir: string;
  private enabled: boolean;

  constructor() {
    this.defaultVoice = 'Samantha'; // Female voice
    this.defaultRate = 200; // Medium speed
    this.enabled = true;
    
    const homeDir = process.env.HOME || '';
    this.audioDir = path.join(homeDir, '.rags', 'audio');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.audioDir, { recursive: true });
      console.log('🔊 TTS initialized');
    } catch (error) {
      console.error('TTS init failed:', error);
    }
  }

  /**
   * Speak text using macOS say command
   */
  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.enabled || !text) return;

    try {
      const voice = options.voice || this.defaultVoice;
      const rate = options.rate || this.defaultRate;

      if (options.saveToFile) {
        // Save to audio file
        const audioFile = path.join(this.audioDir, options.saveToFile);
        await execAsync(`say -v ${voice} -r ${rate} -o "${audioFile}" --data-format=LEF32@22050 "${text.replace(/"/g, '\\"')}"`);
        console.log(`🔊 Audio saved: ${audioFile}`);
      } else {
        // Speak directly (BLOCKING - wait for completion)
        console.log(`🔊 Speaking: ${text.substring(0, 50)}...`);
        await execAsync(`say -v ${voice} -r ${rate} "${text.replace(/"/g, '\\"')}"`);
        console.log('✅ SimpleTTS playback complete');
      }
    } catch (error) {
      console.error('TTS failed:', error);
    }
  }

  /**
   * Speak with female voice (default)
   */
  async speakFemale(text: string): Promise<void> {
    await this.speak(text, { voice: 'Samantha' });
  }

  /**
   * Speak with male voice
   */
  async speakMale(text: string): Promise<void> {
    await this.speak(text, { voice: 'Alex' });
  }

  /**
   * Speak faster
   */
  async speakFast(text: string): Promise<void> {
    await this.speak(text, { rate: 250 });
  }

  /**
   * Speak slower
   */
  async speakSlow(text: string): Promise<void> {
    await this.speak(text, { rate: 150 });
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('say -v "?"');
      const voices = stdout.split('\n')
        .filter(line => line.trim())
        .map(line => line.split(/\s+/)[0]);
      return voices;
    } catch (error) {
      console.error('Failed to get voices:', error);
      return ['Samantha', 'Alex', 'Karen'];
    }
  }

  /**
   * Stop speaking
   */
  async stop(): Promise<void> {
    try {
      await execAsync('killall say');
      console.log('🔇 TTS stopped');
    } catch (error) {
      // Ignore error if say not running
    }
  }

  /**
   * Enable/disable TTS
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`🔊 TTS ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if TTS is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('which say');
      return true;
    } catch {
      return false;
    }
  }
}

export const simpleTTS = new SimpleTTS();
