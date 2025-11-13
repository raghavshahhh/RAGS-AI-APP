// ============================================================================
// OFFLINE STT - Whisper.cpp integration for offline speech recognition
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface STTConfig {
  modelPath?: string;
  language: 'en' | 'hi' | 'auto';
  threads: number;
}

export class OfflineSTT {
  private config: STTConfig;
  private tempDir: string;
  private whisperAvailable: boolean = false;

  constructor(config?: Partial<STTConfig>) {
    this.config = {
      modelPath: process.env.WHISPER_MODEL_PATH || '/usr/local/share/whisper/ggml-base.en.bin',
      language: 'auto',
      threads: 4,
      ...config
    };

    const homeDir = process.env.HOME || '';
    this.tempDir = path.join(homeDir, '.rags', 'temp', 'audio');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      
      // Check if whisper is available
      try {
        await execAsync('which whisper');
        this.whisperAvailable = true;
        console.log('✅ Whisper.cpp available for offline STT');
      } catch {
        console.log('⚠️  Whisper.cpp not found. Install from: https://github.com/ggerganov/whisper.cpp');
        console.log('   Falling back to online STT');
      }
    } catch (error) {
      console.error('Offline STT init failed:', error);
    }
  }

  /**
   * Transcribe audio file (offline)
   */
  async transcribe(audioPath: string): Promise<string> {
    if (!this.whisperAvailable) {
      throw new Error('Whisper.cpp not available. Please install it.');
    }

    try {
      console.log('🎤 Transcribing with Whisper.cpp (offline)...');

      const cmd = `whisper -m "${this.config.modelPath}" -f "${audioPath}" -t ${this.config.threads} -nt`;
      
      const { stdout } = await execAsync(cmd);
      const text = stdout.trim();

      console.log(`✅ Transcription: ${text.substring(0, 50)}...`);
      return text;
    } catch (error) {
      console.error('Whisper transcription failed:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio buffer
   */
  async transcribeBuffer(audioBuffer: Buffer): Promise<string> {
    const tempFile = path.join(this.tempDir, `audio_${Date.now()}.wav`);
    
    try {
      await fs.writeFile(tempFile, audioBuffer);
      const text = await this.transcribe(tempFile);
      await fs.unlink(tempFile).catch(() => {});
      return text;
    } catch (error) {
      await fs.unlink(tempFile).catch(() => {});
      throw error;
    }
  }

  /**
   * Check if offline STT is available
   */
  isAvailable(): boolean {
    return this.whisperAvailable;
  }

  /**
   * Set language
   */
  setLanguage(language: 'en' | 'hi' | 'auto'): void {
    this.config.language = language;
    console.log(`🌍 STT language set to: ${language}`);
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return ['en', 'hi', 'auto'];
  }
}

export const offlineSTT = new OfflineSTT();
