// ============================================================================
// EDGE TTS - Microsoft Edge Text-to-Speech with Emotional Tones
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface EdgeTTSOptions {
  voice?: string;
  rate?: string; // '+0%', '+10%', '-10%'
  volume?: string; // '+0%', '+10%', '-10%'
  pitch?: string; // '+0Hz', '+10Hz', '-10Hz'
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited' | 'calm';
}

/**
 * Edge TTS Service - Uses Microsoft Edge's high-quality TTS
 * Supports emotional tones and multiple languages
 */
export class EdgeTTS {
  private audioDir: string;
  private enabled: boolean;
  private defaultVoice: string;

  // FIXED: Use single consistent male voice for all emotions
  private emotionalVoices = {
    neutral: 'en-US-GuyNeural',     // Consistent male voice
    happy: 'en-US-GuyNeural',       // Same voice
    excited: 'en-US-GuyNeural',     // Same voice
    calm: 'en-US-GuyNeural',        // Same voice
    sad: 'en-US-GuyNeural',         // Same voice
    angry: 'en-US-GuyNeural',       // Same voice
  };

  constructor() {
    this.defaultVoice = 'en-US-GuyNeural';  // Single male voice
    this.enabled = true;
    
    const homeDir = process.env.HOME || '';
    this.audioDir = path.join(homeDir, '.rags', 'audio');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.audioDir, { recursive: true });
      
      // Check if edge-tts is installed
      try {
        await execAsync('which edge-tts');
        console.log('🔊 Edge-TTS available');
      } catch {
        console.log('⚠️  edge-tts not installed. Install with: pip install edge-tts');
        console.log('   Falling back to macOS say command');
      }
    } catch (error) {
      console.error('Edge-TTS init failed:', error);
    }
  }

  /**
   * Speak text with emotional tone
   */
  async speak(text: string, options: EdgeTTSOptions = {}): Promise<void> {
    if (!this.enabled || !text) return;

    try {
      // Select voice based on emotion
      const emotion = options.emotion || 'neutral';
      const voice = this.emotionalVoices[emotion] || this.defaultVoice;

      // Check if edge-tts is available
      try {
        await execAsync('which edge-tts');
        await this.speakWithEdgeTTS(text, voice, options);
      } catch {
        // Fallback to macOS say with emotion-based voice
        await this.speakWithMacOS(text, emotion);
      }

      console.log(`🔊 Speaking (${emotion}): ${text.substring(0, 50)}...`);
    } catch (error) {
      console.error('Edge-TTS failed:', error);
      // Ultimate fallback
      await this.speakWithMacOS(text, 'neutral');
    }
  }

  /**
   * Speak using Edge-TTS (if installed)
   */
  private async speakWithEdgeTTS(
    text: string, 
    voice: string, 
    options: EdgeTTSOptions
  ): Promise<void> {
    const tempFile = path.join(this.audioDir, `temp_${Date.now()}.mp3`);
    
    // Build edge-tts command
    let cmd = `edge-tts --voice "${voice}" --text "${text.replace(/"/g, '\\"')}" --write-media "${tempFile}"`;
    
    // Add rate, pitch, volume if specified
    if (options.rate) cmd += ` --rate="${options.rate}"`;
    if (options.pitch) cmd += ` --pitch="${options.pitch}"`;
    if (options.volume) cmd += ` --volume="${options.volume}"`;

    // Generate audio file
    await execAsync(cmd);

    // Play the audio file and WAIT for it to complete (BLOCKING)
    try {
      await execAsync(`afplay "${tempFile}"`);
      console.log('✅ Edge-TTS playback complete');
    } catch (error) {
      console.error('Playback error:', error);
    }
    
    // Clean up after playback
    try {
      await fs.unlink(tempFile);
    } catch {}
  }

  /**
   * Fallback to macOS say command with emotional voice mapping
   */
  private async speakWithMacOS(text: string, emotion: string): Promise<void> {
    const voiceMap: Record<string, string> = {
      neutral: 'Samantha',
      happy: 'Victoria',
      excited: 'Alex',
      calm: 'Samantha',
      sad: 'Karen',
      angry: 'Daniel',
    };

    const voice = voiceMap[emotion] || 'Samantha';
    const rate = emotion === 'excited' ? 210 : emotion === 'calm' ? 180 : 200;

    // Use execAsync to WAIT for the say command to complete (BLOCKING)
    try {
      await execAsync(`say -v ${voice} -r ${rate} "${text.replace(/"/g, '\\\\"')}"`);
      console.log('✅ macOS TTS playback complete');
    } catch (error) {
      console.error('macOS TTS error:', error);
    }
  }

  /**
   * Speak with happy emotion
   */
  async speakHappy(text: string): Promise<void> {
    await this.speak(text, { emotion: 'happy', rate: '+10%' });
  }

  /**
   * Speak with excited emotion
   */
  async speakExcited(text: string): Promise<void> {
    await this.speak(text, { emotion: 'excited', rate: '+20%', pitch: '+5Hz' });
  }

  /**
   * Speak with calm emotion
   */
  async speakCalm(text: string): Promise<void> {
    await this.speak(text, { emotion: 'calm', rate: '-10%', pitch: '-5Hz' });
  }

  /**
   * Speak with sad emotion
   */
  async speakSad(text: string): Promise<void> {
    await this.speak(text, { emotion: 'sad', rate: '-15%', pitch: '-10Hz' });
  }

  /**
   * Speak with angry emotion
   */
  async speakAngry(text: string): Promise<void> {
    await this.speak(text, { emotion: 'angry', rate: '+5%', volume: '+20%' });
  }

  /**
   * Set default voice
   */
  setVoice(voiceId: string): void {
    this.defaultVoice = voiceId;
    console.log(`🎵 EdgeTTS voice changed to: ${voiceId}`);
  }

  /**
   * Get current voice
   */
  getCurrentVoice(): string {
    return this.defaultVoice;
  }

  /**
   * List available voices
   */
  async listVoices(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('edge-tts --list-voices');
      return stdout.split('\n').filter(line => line.trim());
    } catch {
      return Object.values(this.emotionalVoices);
    }
  }

  /**
   * Stop speaking
   */
  async stop(): Promise<void> {
    try {
      await execAsync('killall afplay say 2>/dev/null || true');
      console.log('🔇 TTS stopped');
    } catch {
      // Ignore errors
    }
  }

  /**
   * Enable/disable TTS
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`🔊 Edge-TTS ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if Edge-TTS is available
   */
  async isEdgeTTSAvailable(): Promise<boolean> {
    try {
      await execAsync('which edge-tts');
      return true;
    } catch {
      return false;
    }
  }
}

export const edgeTTS = new EdgeTTS();
