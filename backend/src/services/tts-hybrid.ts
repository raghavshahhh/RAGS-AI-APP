// ============================================================================
// RAGS AI - Hybrid TTS (ElevenLabs + Coqui Offline Fallback)
// ============================================================================

import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

interface TTSConfig {
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  coquiModelPath?: string;
  preferOffline?: boolean;
  cacheEnabled?: boolean;
}

interface SpeechOptions {
  text: string;
  voice?: string;
  speed?: number; // 0.5 to 2.0
  stability?: number; // 0.0 to 1.0 (ElevenLabs only)
  similarity?: number; // 0.0 to 1.0 (ElevenLabs only)
}

export class HybridTTS extends EventEmitter {
  private config: TTSConfig;
  private cacheDir: string;
  private isOnline: boolean = true;

  constructor(config: TTSConfig) {
    super();
    this.config = {
      elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Default: Bella
      preferOffline: false,
      cacheEnabled: true,
      ...config,
    };

    this.cacheDir = path.join(process.cwd(), 'cache', 'tts');
    this.checkConnectivity();
  }

  /**
   * Initialize TTS system
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log('✅ Hybrid TTS initialized');
    } catch (error) {
      console.error('Failed to initialize TTS:', error);
      throw error;
    }
  }

  /**
   * Generate speech from text
   */
  async speak(options: SpeechOptions): Promise<Buffer> {
    try {
      // Check cache first
      if (this.config.cacheEnabled) {
        const cached = await this.getFromCache(options.text);
        if (cached) {
          console.log('🎵 Using cached audio');
          return cached;
        }
      }

      // Try ElevenLabs if online and not preferring offline
      if (this.isOnline && !this.config.preferOffline && this.config.elevenLabsApiKey) {
        try {
          const audio = await this.speakElevenLabs(options);
          
          // Cache the result
          if (this.config.cacheEnabled) {
            await this.saveToCache(options.text, audio);
          }
          
          return audio;
        } catch (error) {
          console.warn('⚠️  ElevenLabs failed, falling back to Coqui:', error);
          this.isOnline = false;
        }
      }

      // Fallback to Coqui (offline)
      console.log('🎵 Using Coqui TTS (offline)');
      const audio = await this.speakCoqui(options);
      
      if (this.config.cacheEnabled) {
        await this.saveToCache(options.text, audio);
      }
      
      return audio;
    } catch (error) {
      console.error('❌ TTS failed:', error);
      throw error;
    }
  }

  /**
   * ElevenLabs TTS (Online, High Quality)
   */
  private async speakElevenLabs(options: SpeechOptions): Promise<Buffer> {
    const voiceId = options.voice || this.config.elevenLabsVoiceId!;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await axios.post(
      url,
      {
        text: options.text,
        model_id: 'eleven_turbo_v2', // Fast model
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarity || 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      },
      {
        headers: {
          'xi-api-key': this.config.elevenLabsApiKey!,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
        timeout: 10000,
      }
    );

    console.log('✅ ElevenLabs TTS complete');
    return Buffer.from(response.data);
  }

  /**
   * Coqui TTS (Offline, Fast)
   */
  private async speakCoqui(options: SpeechOptions): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      const outputFile = path.join(this.cacheDir, `temp_${Date.now()}.wav`);

      // Coqui TTS command
      const args = [
        '--text', options.text,
        '--out_path', outputFile,
      ];

      if (this.config.coquiModelPath) {
        args.push('--model_path', this.config.coquiModelPath);
      }

      const process = spawn('tts', args);

      let errorOutput = '';

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', async (code) => {
        if (code === 0) {
          try {
            const audio = await fs.readFile(outputFile);
            await fs.unlink(outputFile).catch(() => {});
            console.log('✅ Coqui TTS complete');
            resolve(audio);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`Coqui TTS failed: ${errorOutput}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Get audio from cache
   */
  private async getFromCache(text: string): Promise<Buffer | null> {
    try {
      const hash = this.hashText(text);
      const cachePath = path.join(this.cacheDir, `${hash}.mp3`);
      const audio = await fs.readFile(cachePath);
      return audio;
    } catch {
      return null;
    }
  }

  /**
   * Save audio to cache
   */
  private async saveToCache(text: string, audio: Buffer): Promise<void> {
    try {
      const hash = this.hashText(text);
      const cachePath = path.join(this.cacheDir, `${hash}.mp3`);
      await fs.writeFile(cachePath, audio);
    } catch (error) {
      console.warn('Failed to cache audio:', error);
    }
  }

  /**
   * Simple text hash for cache keys
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check internet connectivity
   */
  private async checkConnectivity(): Promise<void> {
    try {
      await axios.get('https://api.elevenlabs.io/v1/voices', {
        timeout: 3000,
        headers: { 'xi-api-key': this.config.elevenLabsApiKey || '' },
      });
      this.isOnline = true;
    } catch {
      this.isOnline = false;
      console.log('📡 Offline mode - using Coqui TTS');
    }
  }

  /**
   * Clear TTS cache
   */
  async clearCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map(file => fs.unlink(path.join(this.cacheDir, file)))
      );
      console.log('🗑️  TTS cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get available ElevenLabs voices
   */
  async getVoices(): Promise<any[]> {
    if (!this.config.elevenLabsApiKey) {
      return [];
    }

    try {
      const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': this.config.elevenLabsApiKey },
      });
      return response.data.voices;
    } catch (error) {
      console.error('Failed to get voices:', error);
      return [];
    }
  }
}

// ============================================================================
// Usage Example
// ============================================================================

/*
import { HybridTTS } from './tts-hybrid';

const tts = new HybridTTS({
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL',
  preferOffline: false,
  cacheEnabled: true,
});

await tts.initialize();

// Generate speech
const audio = await tts.speak({
  text: 'Hey bro, what's up? Ready to crush some tasks today?',
  stability: 0.5,
  similarity: 0.75,
});

// Play audio or save to file
await fs.writeFile('output.mp3', audio);
*/

