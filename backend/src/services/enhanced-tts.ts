// ============================================================================
// ENHANCED TTS - Edge-TTS + ElevenLabs with emotion control
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';

const execAsync = promisify(exec);

interface TTSConfig {
  provider: 'edge' | 'elevenlabs' | 'macos';
  voice: string;
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited' | 'calm';
  speed: number; // 0.5 to 2.0
  pitch: number; // -10 to 10
}

export class EnhancedTTS {
  private config: TTSConfig;
  private audioDir: string;
  private elevenLabsKey?: string;
  private edgeAvailable: boolean = false;

  // Indian accent voices
  private indianVoices = {
    edge: 'en-IN-PrabhatNeural', // Male Indian
    elevenlabs: 'pNInz6obpgDQGcFmaJgB', // Adam (can be customized)
    macos: 'Rishi' // Indian voice on macOS
  };

  constructor() {
    this.config = {
      provider: 'edge',
      voice: this.indianVoices.edge,
      emotion: 'neutral',
      speed: 1.0,
      pitch: 0
    };

    this.elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    const homeDir = process.env.HOME || '';
    this.audioDir = path.join(homeDir, '.rags', 'audio');
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.audioDir, { recursive: true });
      
      // Check Edge-TTS availability
      try {
        await execAsync('which edge-tts');
        this.edgeAvailable = true;
        console.log('✅ Edge-TTS available (Indian accent)');
      } catch {
        console.log('⚠️  Edge-TTS not found. Install: pip install edge-tts');
      }

      // Check ElevenLabs
      if (this.elevenLabsKey && !this.elevenLabsKey.includes('your_')) {
        console.log('✅ ElevenLabs API key configured');
      }
    } catch (error) {
      console.error('Enhanced TTS init failed:', error);
    }
  }

  /**
   * Speak text with emotion
   */
  async speak(text: string, emotion?: string): Promise<void> {
    if (!text) return;

    const currentEmotion = emotion || this.config.emotion;
    console.log(`🔊 Speaking (${currentEmotion}): ${text.substring(0, 50)}...`);

    try {
      // Try providers in order: ElevenLabs > Edge-TTS > macOS
      if (this.elevenLabsKey && !this.elevenLabsKey.includes('your_')) {
        await this.speakWithElevenLabs(text, currentEmotion);
      } else if (this.edgeAvailable) {
        await this.speakWithEdge(text, currentEmotion);
      } else {
        await this.speakWithMacOS(text, currentEmotion);
      }
    } catch (error) {
      console.error('TTS error:', error);
      // Fallback to macOS
      await this.speakWithMacOS(text, currentEmotion);
    }
  }

  /**
   * Speak with ElevenLabs (premium quality)
   */
  private async speakWithElevenLabs(text: string, emotion: string): Promise<void> {
    try {
      const voiceId = this.indianVoices.elevenlabs;
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

      const response = await axios.post(url, {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: emotion === 'calm' ? 0.8 : 0.5,
          similarity_boost: 0.75,
          style: emotion === 'excited' ? 0.8 : 0.5,
          use_speaker_boost: true
        }
      }, {
        headers: {
          'xi-api-key': this.elevenLabsKey!,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      });

      const tempFile = path.join(this.audioDir, `temp_${Date.now()}.mp3`);
      await fs.writeFile(tempFile, response.data);
      await execAsync(`afplay "${tempFile}"`);
      await fs.unlink(tempFile).catch(() => {});
      
      console.log('✅ ElevenLabs TTS complete');
    } catch (error) {
      console.error('ElevenLabs TTS failed:', error);
      throw error;
    }
  }

  /**
   * Speak with Edge-TTS (Indian accent)
   */
  private async speakWithEdge(text: string, emotion: string): Promise<void> {
    const tempFile = path.join(this.audioDir, `temp_${Date.now()}.mp3`);
    
    // Emotion-based rate and pitch
    const emotionSettings: Record<string, { rate: string; pitch: string }> = {
      neutral: { rate: '+0%', pitch: '+0Hz' },
      happy: { rate: '+10%', pitch: '+5Hz' },
      excited: { rate: '+20%', pitch: '+10Hz' },
      calm: { rate: '-10%', pitch: '-5Hz' },
      sad: { rate: '-15%', pitch: '-10Hz' },
      angry: { rate: '+5%', pitch: '+5Hz' }
    };

    const settings = emotionSettings[emotion] || emotionSettings.neutral;
    
    const cmd = `edge-tts --voice "${this.config.voice}" --text "${text.replace(/"/g, '\\"')}" --rate="${settings.rate}" --pitch="${settings.pitch}" --write-media "${tempFile}"`;
    
    await execAsync(cmd);
    await execAsync(`afplay "${tempFile}"`);
    await fs.unlink(tempFile).catch(() => {});
    
    console.log('✅ Edge-TTS complete');
  }

  /**
   * Speak with macOS say (fallback)
   */
  private async speakWithMacOS(text: string, emotion: string): Promise<void> {
    const voiceMap: Record<string, string> = {
      neutral: 'Rishi',
      happy: 'Rishi',
      excited: 'Rishi',
      calm: 'Rishi',
      sad: 'Rishi',
      angry: 'Rishi'
    };

    const rateMap: Record<string, number> = {
      neutral: 200,
      happy: 210,
      excited: 220,
      calm: 180,
      sad: 170,
      angry: 205
    };

    const voice = voiceMap[emotion] || 'Rishi';
    const rate = rateMap[emotion] || 200;

    await execAsync(`say -v ${voice} -r ${rate} "${text.replace(/"/g, '\\\\"')}"`);
    console.log('✅ macOS TTS complete');
  }

  /**
   * Speak with specific emotion
   */
  async speakHappy(text: string): Promise<void> {
    await this.speak(text, 'happy');
  }

  async speakExcited(text: string): Promise<void> {
    await this.speak(text, 'excited');
  }

  async speakCalm(text: string): Promise<void> {
    await this.speak(text, 'calm');
  }

  async speakSad(text: string): Promise<void> {
    await this.speak(text, 'sad');
  }

  async speakAngry(text: string): Promise<void> {
    await this.speak(text, 'angry');
  }

  /**
   * Set voice provider
   */
  setProvider(provider: 'edge' | 'elevenlabs' | 'macos'): void {
    this.config.provider = provider;
    console.log(`🎵 TTS provider set to: ${provider}`);
  }

  /**
   * Set speed (0.5 to 2.0)
   */
  setSpeed(speed: number): void {
    this.config.speed = Math.max(0.5, Math.min(2.0, speed));
    console.log(`⚡ TTS speed set to: ${this.config.speed}x`);
  }

  /**
   * Stop speaking
   */
  async stop(): Promise<void> {
    try {
      await execAsync('killall afplay say 2>/dev/null || true');
      console.log('🔇 TTS stopped');
    } catch {}
  }
}

export const enhancedTTS = new EnhancedTTS();
