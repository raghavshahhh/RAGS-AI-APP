// ============================================================================
// RAGS AI - Local Whisper.cpp Speech-to-Text (Offline)
// ============================================================================

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

interface WhisperConfig {
  modelPath: string; // Path to whisper model (e.g., ggml-base.en.bin)
  language?: string; // 'en', 'hi', 'auto'
  threads?: number; // CPU threads to use
  translate?: boolean; // Translate to English
}

interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export class WhisperLocalSTT extends EventEmitter {
  private config: WhisperConfig;
  private whisperBinary: string;
  private tempDir: string;

  constructor(config: WhisperConfig) {
    super();
    this.config = {
      language: 'auto',
      threads: 4,
      translate: false,
      ...config,
    };

    // Path to whisper.cpp binary
    this.whisperBinary = process.env.WHISPER_CPP_PATH || '/usr/local/bin/whisper';
    this.tempDir = path.join(process.cwd(), 'temp', 'audio');
  }

  /**
   * Initialize - ensure temp directory exists
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      console.log('✅ Whisper STT initialized');
    } catch (error) {
      console.error('Failed to initialize Whisper:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio file to text (OFFLINE)
   */
  async transcribe(audioPath: string): Promise<TranscriptionResult> {
    const startTime = Date.now();

    try {
      console.log('🎤 Transcribing audio with Whisper.cpp...');

      // Build whisper command
      const args = [
        '-m', this.config.modelPath,
        '-f', audioPath,
        '-t', this.config.threads!.toString(),
        '-nt', // No timestamps in output
      ];

      // Add language if specified
      if (this.config.language && this.config.language !== 'auto') {
        args.push('-l', this.config.language);
      }

      // Translate to English if requested
      if (this.config.translate) {
        args.push('--translate');
      }

      // Run whisper.cpp
      const result = await this.runWhisper(args);

      const duration = Date.now() - startTime;

      console.log(`✅ Transcription complete in ${duration}ms`);

      return {
        text: result.trim(),
        language: this.config.language || 'auto',
        duration,
      };
    } catch (error) {
      console.error('❌ Transcription failed:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio buffer (from microphone)
   */
  async transcribeBuffer(audioBuffer: Buffer): Promise<TranscriptionResult> {
    // Save buffer to temp file
    const tempFile = path.join(this.tempDir, `audio_${Date.now()}.wav`);
    
    try {
      await fs.writeFile(tempFile, audioBuffer);
      const result = await this.transcribe(tempFile);
      
      // Cleanup temp file
      await fs.unlink(tempFile).catch(() => {});
      
      return result;
    } catch (error) {
      // Cleanup on error
      await fs.unlink(tempFile).catch(() => {});
      throw error;
    }
  }

  /**
   * Transcribe with detailed segments (timestamps)
   */
  async transcribeWithSegments(audioPath: string): Promise<TranscriptionResult> {
    try {
      const args = [
        '-m', this.config.modelPath,
        '-f', audioPath,
        '-t', this.config.threads!.toString(),
        '-osrt', // Output SRT format for segments
      ];

      if (this.config.language && this.config.language !== 'auto') {
        args.push('-l', this.config.language);
      }

      const result = await this.runWhisper(args);
      const segments = this.parseSRT(result);

      return {
        text: segments.map(s => s.text).join(' '),
        language: this.config.language || 'auto',
        duration: 0,
        segments,
      };
    } catch (error) {
      console.error('Failed to transcribe with segments:', error);
      throw error;
    }
  }

  /**
   * Run whisper.cpp binary
   */
  private runWhisper(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      let output = '';
      let errorOutput = '';

      const process = spawn(this.whisperBinary, args);

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Whisper failed with code ${code}: ${errorOutput}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Parse SRT subtitle format to segments
   */
  private parseSRT(srt: string): Array<{ start: number; end: number; text: string }> {
    const segments: Array<{ start: number; end: number; text: string }> = [];
    const blocks = srt.trim().split('\n\n');

    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length < 3) continue;

      const timeLine = lines[1];
      const text = lines.slice(2).join(' ');

      const [startStr, endStr] = timeLine.split(' --> ');
      const start = this.parseTimestamp(startStr);
      const end = this.parseTimestamp(endStr);

      segments.push({ start, end, text });
    }

    return segments;
  }

  /**
   * Parse SRT timestamp to seconds
   */
  private parseTimestamp(timestamp: string): number {
    const [time, ms] = timestamp.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + Number(ms) / 1000;
  }

  /**
   * Update model (switch between tiny, base, small, medium, large)
   */
  updateModel(modelPath: string): void {
    this.config.modelPath = modelPath;
    console.log(`🔄 Whisper model updated to: ${modelPath}`);
  }

  /**
   * Set language
   */
  setLanguage(language: string): void {
    this.config.language = language;
    console.log(`🌍 Language set to: ${language}`);
  }
}

// ============================================================================
// Usage Example
// ============================================================================

/*
import { WhisperLocalSTT } from './stt-whisper-local';

const whisper = new WhisperLocalSTT({
  modelPath: '/path/to/ggml-base.en.bin',
  language: 'en',
  threads: 4,
});

await whisper.initialize();

// Transcribe file
const result = await whisper.transcribe('/path/to/audio.wav');
console.log('Transcription:', result.text);

// Transcribe buffer (from mic)
const buffer = await recordAudio(); // Your audio recording function
const result2 = await whisper.transcribeBuffer(buffer);
console.log('Transcription:', result2.text);
*/

