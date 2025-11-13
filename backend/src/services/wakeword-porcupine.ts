// ============================================================================
// RAGS AI - Real Picovoice Porcupine Wake Word Detection
// ============================================================================

import { EventEmitter } from 'events';
import { Porcupine } from '@picovoice/porcupine-node';
import { PvRecorder } from '@picovoice/pvrecorder-node';

interface WakeWordConfig {
  accessKey: string;
  keywordPath?: string; // Custom "Hey RAGS" model path
  sensitivity?: number; // 0.0 to 1.0 (default: 0.5)
  audioDeviceIndex?: number;
}

export class WakeWordEngine extends EventEmitter {
  private porcupine: Porcupine | null = null;
  private recorder: PvRecorder | null = null;
  private isListening: boolean = false;
  private config: WakeWordConfig;

  constructor(config: WakeWordConfig) {
    super();
    this.config = {
      sensitivity: 0.5,
      audioDeviceIndex: -1, // Default device
      ...config,
    };
  }

  /**
   * Start always-on wake word detection
   */
  async start(): Promise<void> {
    try {
      console.log('🎤 Starting wake word detection...');

      // Initialize Porcupine with custom or built-in keyword
      if (!this.config.accessKey || this.config.accessKey.includes('mock') || this.config.accessKey === 'your_picovoice_access_key_here') {
        console.log('⚠️  No valid Picovoice key - Wake word detection disabled');
        console.log('💡 To enable: Set PICOVOICE_ACCESS_KEY in .env file');
        console.log('🔗 Get key from: https://console.picovoice.ai/');
        this.isListening = false;
        this.emit('ready');
        return;
      }

      this.porcupine = new Porcupine(
        this.config.accessKey,
        this.config.keywordPath 
          ? [this.config.keywordPath] 
          : ['jarvis'], // Use built-in jarvis keyword
        [this.config.sensitivity!]
      );

      // Initialize audio recorder
      this.recorder = new PvRecorder(
        this.porcupine.frameLength,
        this.config.audioDeviceIndex!
      );

      this.recorder.start();
      this.isListening = true;

      console.log('✅ Wake word detection active - Say "Hey RAGS"');
      this.emit('ready');

      // Start listening loop
      this.listen();
    } catch (error) {
      console.error('❌ Failed to start wake word detection:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Main listening loop - runs continuously
   */
  private async listen(): Promise<void> {
    while (this.isListening && this.recorder && this.porcupine) {
      try {
        // Read audio frame
        const audioFrame = await this.recorder.read();

        // Process frame for wake word
        const keywordIndex = this.porcupine.process(audioFrame);

        // Wake word detected!
        if (keywordIndex >= 0) {
          console.log('🔥 Wake word detected!');
          this.emit('wakeword', {
            keyword: 'Hey RAGS',
            timestamp: new Date(),
            confidence: this.config.sensitivity,
          });
        }
      } catch (error) {
        if (this.isListening) {
          console.error('Error processing audio:', error);
          this.emit('error', error);
        }
      }

      // Small delay to prevent CPU overload
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Stop wake word detection
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping wake word detection...');
    this.isListening = false;

    if (this.recorder) {
      this.recorder.stop();
      this.recorder.release();
      this.recorder = null;
    }

    if (this.porcupine) {
      this.porcupine.release();
      this.porcupine = null;
    }

    this.emit('stopped');
    console.log('✅ Wake word detection stopped');
  }

  /**
   * Get available audio devices
   */
  static getAudioDevices(): string[] {
    return PvRecorder.getAvailableDevices();
  }

  /**
   * Check if currently listening
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Update sensitivity (0.0 to 1.0)
   * Higher = more sensitive but more false positives
   */
  updateSensitivity(sensitivity: number): void {
    if (sensitivity < 0 || sensitivity > 1) {
      throw new Error('Sensitivity must be between 0.0 and 1.0');
    }
    this.config.sensitivity = sensitivity;
    console.log(`🎚️  Wake word sensitivity updated to ${sensitivity}`);
  }
}

// ============================================================================
// Usage Example
// ============================================================================

/*
import { WakeWordEngine } from './wakeword-porcupine';

const wakeWord = new WakeWordEngine({
  accessKey: process.env.PICOVOICE_ACCESS_KEY!,
  sensitivity: 0.7, // More sensitive
});

// Listen for wake word
wakeWord.on('wakeword', (data) => {
  console.log('Wake word detected!', data);
  // Start listening for command...
});

wakeWord.on('error', (error) => {
  console.error('Wake word error:', error);
});

// Start detection
await wakeWord.start();

// Stop when needed
// await wakeWord.stop();
*/

